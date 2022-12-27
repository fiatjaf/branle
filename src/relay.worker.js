import mergebounce from 'mergebounce'
import { relayPool } from 'nostr-tools'
// import {debounce} from 'quasar'

export const pool = relayPool()
// let mainUserSub = null
// let adhocSub = null
let poolSubs = {}

let relays = {}
let subs = {}
let active = true
// let lastSync = 0

let dbWorkerPort = null

pool.onNotice((notice, relay) => {
  try {
    dbWorkerPort.postMessage({type: 'notice', notice, relay: relay.url})
  } catch (e) {
    console.log('error posting message to db from pool', e, 'notice', notice, 'url ', relay.url)
  }
})

let debounceCount = 0
// let debounceTime = Date.now()
// let debouncedEvents = []
// function emitEvents(events) {
//   dbWorkerPort.postMessage({ type: 'events', events })
//   debouncedEvents = []
// }
// const debouncedEmitEvents = debounce(emitEvents, 1000)

let debouncedEmitEvent = mergebounce(
  events => dbWorkerPort.postMessage({ type: 'events', events }),
  1000,
  { 'concatArrays': true, 'promise': true, maxWait: 3000 }
)

function onEvent(event, relay) {
    if (!active) return
    // debouncedEvents.push({ event, relay })
    // if (debounceCount >= 2000 || Date.now() - debounceTime > 2000) emitEvents(debouncedEvents)
    // debouncedEmitEvents(debouncedEvents)
    if (debounceCount >= 2000) {
      debouncedEmitEvent.flush()
      debounceCount = 0
    }
    debouncedEmitEvent([{ event, relay }])
    debounceCount++
}

function onEose(url) {
  // console.log('EOSE', url)
}

function calcFilter(subName) {
  let compiledSubs = Object.values(subs)
    .filter(sub => subName === (sub.subName || 'adhoc'))
    // .map(([_, sub]) => sub)
    .reduce((acc, { type, value }) => {
      if (type === 'user') {
        acc[type] = [value]
        return acc
      } else if (type === 'feed') {
        if (!acc[type] || acc[type] >= value) acc[type] = value
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
            kinds: [1],
            limit: 5000
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
        case 'userTags':
          return {
            '#p': value,
            kinds: [1, 3, 4],
            limit: 5000
          }
        case 'userMessages':
          return {
            authors: value,
            kinds: [4],
            limit: 5000
          }
        case 'feed':
          return {
            since: value,
            kinds: [1, 2],
            limit: 5000
          }
        case 'event':
          return {
            ids: value
          }
        default:
          return {
            [type]: value,
            kinds: [0, 1, 2, 3, 4]
          }
      }
    })
  console.log('filter', subName, filter)
  return filter
}

function cancelSub(id) {
  let cancelledSub = subs[id]
  delete subs[id]
  if (!active) return
  if (!cancelledSub.subName) cancelledSub.subName = 'adhoc'
  if (poolSubs[cancelledSub.subName]) {
    if (Object.keys(subs).filter(id => cancelledSub.subName === (subs[id].subName || 'adhoc')).length === 0) poolSubs[cancelledSub.subName].unsub()
    else poolSubs[cancelledSub.subName].sub({filter: calcFilter(cancelledSub.subName)})
  }
  // if (cancelledSub.subName === 'mainUser') {
  //   if (mainUserSub) {
  //     if (Object.keys(subs).filter(id => cancelledSub.subName === 'mainUser').length === 0) mainUserSub.unsub()
  //     else mainUserSub.sub({filter: calcFilter('mainUser')})
  //   }
  // } else {
  //   if (adhocSub) {
  //     if (Object.keys(subs).filter(id => !cancelledSub.subName).length === 0) adhocSub.unsub()
  //     else adhocSub.sub({filter: calcFilter()})
  //   }
  // }
}

const methods = {
  close() {
    self.close()
    return
  },

  activateSub() {
    active = true
    Object.keys(poolSubs).forEach(subName => poolSubs[subName].sub({filter: calcFilter(subName)}))
    // if (mainUserSub && Object.keys(subs).filter(id => subs[id].subName === 'mainUser').length) mainUserSub.sub({filter: calcFilter('mainUser')})
    // if (adhocSub && Object.keys(subs).filter(id => !subs[id].subName).length) adhocSub.sub({filter: calcFilter()})
    return
  },

  deactivateSub() {
    active = false
    Object.keys(poolSubs).forEach(subName => poolSubs[subName].unsub())
    // if (mainUserSub) mainUserSub.unsub()
    // if (adhocSub) adhocSub.unsub()
    // emitEvents(debouncedEvents)
    debouncedEmitEvent.flush()
    return
  },

  subUser(pubkey) {
    return {
      type: 'user',
      value: pubkey,
      subName: 'mainUser'
    }
  },

  subUserNotes(pubkey) {
    return {
      type: 'userNotes',
      value: pubkey
    }
  },

  subUserProfile(pubkeys) {
    // let pubkeys = Array.isArray(pubkey) ? pubkey : [pubkey]
    return {
      type: 'userProfile',
      value: pubkeys
    }
  },

  subUserFollows(pubkeys) {
    // let pubkeys = Array.isArray(pubkey) ? pubkey : [pubkey]
    return {
      type: 'userFollows',
      value: pubkeys
    }
  },

  subUserFollowers(pubkeys) {
    // let pubkeys = Array.isArray(pubkey) ? pubkey : [pubkey]
    return {
      type: 'userFollowers',
      value: pubkeys
    }
  },

  subUserTags(pubkeys) {
    // let pubkeys = Array.isArray(pubkey) ? pubkey : [pubkey]
    return {
      type: 'userTags',
      value: pubkeys,
      subName: 'mainUser'
    }
  },

  // subUserMessages(pubkey) {
  //   // let pubkeys = Array.isArray(pubkey) ? pubkey : [pubkey]
  //   return {
  //     type: 'userMessages',
  //     value: pubkeys
  //   }
  // },

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
      value: Math.max(since, 0),
      subName: 'mainFeed'
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
    // lastSync = Math.max(userLastSync, 0)
    for (let url in newRelays) {
      if (!relays[url]) pool.addRelay(url, newRelays[url])
      else if (relays[url].read !== newRelays[url].read || relays[url].write !== newRelays[url].write) {
        pool.removeRelay(url)
        pool.addRelay(url, newRelays[url])
        console.log(url, newRelays[url])
      }
    }
    for (let url in relays) {
      if (!newRelays[url]) pool.removeRelay(url)
      if (!newRelays[url]) console.log('removing relay', url)
    }
    relays = newRelays
    return relays
  },

  setPrivateKey(privkey) {
    pool.setPrivateKey(privkey)
    return true
  },

  publish(event, relayURL) {
    if (relayURL) pool.relays[relayURL]?.relay?.publish?.(event)
    else pool.publish(event, (status, url) => {
      if (status === 0) {
        console.log(`publish request sent to ${url}`)
      }
      if (status === 1) {
        console.log(`event published by ${url}`, event)
      }
    })
    return event
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
    let subName = subs[id].subName || 'adhoc'
    if (poolSubs[subName]) poolSubs[subName].sub({filter: calcFilter(subName)})
    else {
      let subNameId = subName + ' ' + Math.random().toString().slice(-4)
      poolSubs[subName] = pool.sub({ cb: onEvent, filter: calcFilter(subName)}, subNameId, onEose)
    }
    // if (subs[id].subName === 'mainUser') {
    //   if (mainUserSub) mainUserSub.sub({filter: calcFilter('mainUser')})
    //   else mainUserSub = pool.sub({ cb: onEvent, filter: calcFilter('mainUser')}, 'mainUser', onEose)
    // } else {
    //   if (adhocSub) adhocSub.sub({filter: calcFilter()})
    //   else adhocSub = pool.sub({ cb: onEvent, filter: calcFilter()}, 'adhoc', onEose)
    // }
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
