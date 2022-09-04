import mergebounce from 'mergebounce'
// import {pool} from './pool'
// import {pool} from './relay'
import { relayPool } from 'nostr-tools'
// import { relayPool } from './test.js'

export const pool = relayPool()
let poolSub = null

pool.onNotice((notice, relay) => {
  dbWorkerPort.postMessage({type: 'notice', notice, relay})
})

let relays = {}
let subs = {}

let dbWorkerPort = null

let debounceCount = 0
let debouncedEmitEvent = mergebounce(
  events => dbWorkerPort.postMessage({ type: 'events', events }),
  300,
  { 'concatArrays': true, 'promise': true, maxWait: 3000 }
)

function onEvent(event, relay) {
    // postMessage(`[RELAY WORKER] Web worker got this event from ${relay}: ${JSON.stringify(event, null, 2)}`)
    // dbWorkerPort.postMessage({ type: 'event', event, relay })
    if (debounceCount >= 2000) {
      debouncedEmitEvent.flush()
      debounceCount = 0
      // console.log('flushing mergebounce')
    }
    debouncedEmitEvent([{ event, relay }])
    debounceCount++
    // if (![
    //   'wss://rsslay.fiatjaf.com',
    //   'wss://nostr-pub.wellorder.net',
    //   'wss://expensive-relay.fiatjaf.com'
    // ].includes(relay)) console.log('onEvent', event.kind, { event, relay })
    // if ([0, 3].includes(event.kind)) console.log('onEvent', event.kind, { event, relay })
    // postMessage({ type: 'event', event, relay })
}

function calcFilter() {
  let compiledSubs = Object.entries(subs)//.filter(([id, value]) => type === 'ids')
    .map(([_, sub]) => sub)
    .reduce((acc, { type, value }) => {
      if (type === 'user') {
        acc[type] = [value]
        return acc
      // } else if (type === 'user_tagged') {
      //   acc[type] = value
      //   return acc
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
  // relayWorker.postMessage({ type: 'setFilter', filter })
  // console.log('relaysSet', relaysSet, filter)
  // if (relaysSet) {
    // console.log('setFilter', filter)
  // poolSub = poolSub.sub({ cb: onEvent, filter })
  return filter
  // if (!poolSub) poolSub = pool.sub({ cb: onEvent, filter })
  // else poolSub.sub({ filter })
  // poolSub.main.sub({ filter })
  // }
}

function cancelSub(id) {
  delete subs[id]
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

  unsub() {
    // relayWorker.postMessage({ type: 'unsub' })
    // pool.unsub()
    // subs = {}
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
    // relaysSet = true
    // if (Object.keys(subs).length) calcFilter()
    // console.log('queue', queue)
    // if (queue.length) {
    //   queue.forEach(ev => handleMessage(ev))
    //   queue = null
    // }
      // await new Promise((resolve) => setTimeout(resolve, 100))
      // await new Promise((resolve) => setTimeout(resolve, 5000))
    // poolSub = poolSub.sub({ cb: onEvent, filter: [{
    // // return pool.sub({ cb: onEvent, filter: [{
    //   authors: ['8c0da4862130283ff9e67d889df264177a508974e2feb96de139804ea66d6168'],
    //   kinds: [0]
    // }] })
    // if (Object.keys(subs).length) calcFilter()
    relays = newRelays
    // console.log('subs', subs, 'poolSub', poolSub)
    // if (!poolSub) poolSub = pool
    // else {
    // filters = calcFilter()
    // poolSub.sub({ cb: onEvent, filter: filters})
    // }
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

// let poolRelays = {}
// var poolSub = pool
// var poolSub = {}
// let relaysSet = false
// var queue = []
// async function run() {
//   // let queue = []
//   // db is not initialized, collect all requests in a queue
//   self.onmessage = async function (ev) {
//   let { name } = typeof ev.data === 'string' ? JSON.parse(ev.data) : ev.data
//   console.log('ev queue', name, ev)
//     if (name !== 'setRelays') queue.push(ev)
//     else {
//       console.log('ev setRelays', ev)
//     handleMessage(ev)
//       // relaysSet = true
//     }
//   }

//   // while (!relaysSet) {
//     await new Promise((resolve) => setTimeout(resolve, 5000))
//     if (poolSub) calcFilter()
//     // console.log('waiting', relaysSet, queue)
//   // }

//   self.onmessage = handleMessage
//   queue.forEach(ev => handleMessage(ev))
//   queue = null
// }

// run()
self.onmessage = handleMessage

function handleMessage(ev) {
// self.onmessage = async function (ev) {
  // let { name, args, id, stream, cancel } = JSON.parse(ev.data)
  // let { name, args, id, cancel, sub } = JSON.parse(ev.data)
  // console.log('ev.data', ev.data, 'subs', subs)
  // let { name, args, id, cancel, sub } = ev.data
  let { name, args, id, cancel, sub } = typeof ev.data === 'string' ? JSON.parse(ev.data) : ev.data
  if (ev.ports.length && name === 'setPort') {
    dbWorkerPort = ev.ports[0]
    return
  } else if (ev.data.type) return
// console.log('poolRelays', poolRelays)
  // if (Object.keys(poolRelays).length === 0 && name !== 'setRelays') {
  //   queue.push(ev)
  //   return
  // }

  if (cancel) {
    // subs[id].cancel()
    // delete subs[id]
    cancelSub(id)
  } else if (sub) {
    subs[id] = methods[name](...args)
    // console.log(id, 'poolSub', poolSub, 'subs', subs, 'relays', relays)
    // if (!poolSub) {
    //   // for (let url in relays) {
    //   //   pool.addRelay(url, relays[url])
    //   //   // await poolSub.addRelay(url, relays[url])
    //   //   console.log('addRelay var', url, relays[url])
    //   //   // poolRelays[url] = relays[url]
    //   // }
    //   filters = calcFilter()
    //   poolSub = pool.sub({ cb: onEvent, filter: filters })
    // }
    if (poolSub) poolSub.sub({ cb: onEvent, filter: calcFilter()})
    else poolSub = pool.sub({ cb: onEvent, filter: calcFilter()})
    // console.log('calcFilter()', calcFilter())
    // if (poolSub.main) calcFilter()
    // if (poolSub) calcFilter()
  } else {
    var reply = { id }
    let data
    try {
    //   if (name === 'setRelays') {
    //     // poolSub['main'] = data
    //     let relays = args[0]
    //     for (let url in relays) {
    //       await pool.addRelay(url, relays[url])
    //       console.log('addRelay var', url, relays[url])
    //       // poolRelays[url] = relays[url]
    //     }
    //     poolSub['main'] = pool.sub({ cb: onEvent, filter: [{
    //       authors: ['8c0da4862130283ff9e67d889df264177a508974e2feb96de139804ea66d6168'],
    //       kinds: [0, 3]
    //     }] })
    // console.log('poolSub', poolSub, 'subs', subs)
    //     data = poolSub
    //   } else {
        // let data = await methods[name](...args)
        data = methods[name](...args)
        // data = await methods[name](...args)
      // }
      reply.success = true
      reply.data = data
    } catch (err) {
      reply.success = false
      reply.error = err.message
    }
    self.postMessage(JSON.stringify(reply))
  }
}
