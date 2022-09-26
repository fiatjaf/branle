import mergebounce from 'mergebounce'
import { relayPool } from 'nostr-tools'

export const pool = relayPool()
let poolSub = null

pool.onNotice((notice, relay) => {
  dbWorkerPort.postMessage({type: 'notice', notice, relay})
})

let relays = {}
let subs = {}
let active = true

let dbWorkerPort = null

let debounceCount = 0
let debouncedEmitEvent = mergebounce(
  events => dbWorkerPort.postMessage({ type: 'events', events }),
  1000,
  { 'concatArrays': true, 'promise': true, maxWait: 3000 }
)

function onEvent(event, relay) {
    if (!active) return
    if (debounceCount >= 2000) {
      debouncedEmitEvent.flush()
      debounceCount = 0
    }
    debouncedEmitEvent([{ event, relay }])
    debounceCount++
}

function calcFilter() {
  let compiledSubs = Object.entries(subs)
    .map(([_, sub]) => sub)
    .reduce((acc, { type, value }) => {
      if (type === 'user') {
        acc[type] = [value]
        return acc
      } else if (type === 'feed') {
        acc[type] = value
        return acc
      } else if (type === 'tag') {
        let tagType = value.tagType
        let tagValues = value.tagValues
        acc[`#${tagType}`] = (acc[`#${tagType}`] || []).concat(tagValues)
        return acc
      }
      acc[type] = (acc[type] || []).concat(value)
      return acc
    }, {})
  let filter = Object.entries(compiledSubs)
    .map(([type, value]) => {
      switch (type) {
        case 'user':
          return {
            authors: value,
            kinds: [0, 1, 2, 3, 4]
          }
        case 'userNotes':
          return {
            authors: value,
            kinds: [1]
          }
        case 'userProfile':
          return {
            authors: value,
            kinds: [0]
          }
        case 'userFollows':
          return {
            authors: value,
            kinds: [3]
          }
        case 'userFollowers':
          return {
            '#p': value,
            kinds: [3]
          }
        case 'userMessages':
          return {
            authors: value,
            kinds: [4]
          }
        case 'feed':
          return {
            since: value
          }
        case 'event':
          return {
            ids: value
          }
        default:
          return {
            [type]: value
          }
      }
    })
  return filter
}

function cancelSub(id) {
  delete subs[id]
  if (!active) return
  if (poolSub) {
    if (Object.keys(subs).length === 0) poolSub.unsub()
    else poolSub.sub({ cb: onEvent, filter: calcFilter()})
  }
}

const methods = {
  close() {
    self.close()
    return
  },

  activateSub() {
    active = true
    if (poolSub && Object.keys(subs).length) poolSub.sub({ cb: onEvent, filter: calcFilter()})
    return
  },

  deactivateSub() {
    active = false
    if (poolSub) poolSub.unsub()
    debouncedEmitEvent.flush()
    return
  },

  subUser(pubkey) {
    return {
      type: 'user',
      value: pubkey
    }
  },

  subUserNotes(pubkey) {
    return {
      type: 'userNotes',
      value: pubkey
    }
  },

  subUserProfile(pubkey) {
    let pubkeys = Array.isArray(pubkey) ? pubkey : [pubkey]
    return {
      type: 'userProfile',
      value: pubkeys
    }
  },

  subUserFollows(pubkey) {
    let pubkeys = Array.isArray(pubkey) ? pubkey : [pubkey]
    return {
      type: 'userFollows',
      value: pubkeys
    }
  },

  subUserFollowers(pubkey) {
    let pubkeys = Array.isArray(pubkey) ? pubkey : [pubkey]
    return {
      type: 'userFollowers',
      value: pubkeys
    }
  },

  subUserMessages(pubkey) {
    let pubkeys = Array.isArray(pubkey) ? pubkey : [pubkey]
    return {
      type: 'userMessages',
      value: pubkeys
    }
  },

  subTag(type, value) {
    let values = Array.isArray(value) ? value : [value]
    return {
      type: 'tag',
      value: {
        tagType: type,
        tagValues: values
      }
    }
  },

  subFeed(since) {
    return {
      type: 'feed',
      value: since
    }
  },

  subEvent(id) {
    let ids = Array.isArray(id) ? id : [id]
    return {
      type: 'event',
      value: ids
    }
  },

  setRelays(newRelays) {
    for (let url in newRelays) {
      if (!relays[url]) pool.addRelay(url, newRelays[url])
      else if (relays[url].read !== newRelays[url].read || relays[url].write !== newRelays[url].write) {
        pool.removeRelay(url)
        pool.addRelay(url, newRelays[url])
      }
    }
    for (let url in relays) {
      if (!newRelays[url]) pool.removeRelay(url)
      if (!newRelays[url]) console.log('removing relay', url)
    }
    relays = newRelays
    return relays
  },

  publish(event, relayURL) {
    if (relayURL) return pool.relays[relayURL]?.relay?.publish?.(event)
    else pool.publish(event, (status, url) => {
      if (status === 0) {
        console.log(`publish request sent to ${url}`)
      }
      if (status === 1) {
        console.log(`event published by ${url}`, event)
      }
    })
  }
}

self.onmessage = handleMessage

function handleMessage(ev) {
  let { name, args, id, cancel, sub } = typeof ev.data === 'string' ? JSON.parse(ev.data) : ev.data
  if (ev.ports.length && name === 'setPort') {
    dbWorkerPort = ev.ports[0]
    return
  } else if (ev.data.type) return

  if (cancel) {
    cancelSub(id)
  } else if (sub) {
    subs[id] = methods[name](...args)
    if (!active) return
    if (poolSub) poolSub.sub({ cb: onEvent, filter: calcFilter()})
    else poolSub = pool.sub({ cb: onEvent, filter: calcFilter()})
  } else {
    var reply = { id }
    let data
    try {
      data = methods[name](...args)
      reply.success = true
      reply.data = data
    } catch (err) {
      reply.success = false
      reply.error = err.message
    }
    self.postMessage(JSON.stringify(reply))
  }
}
