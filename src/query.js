import {Notify} from 'quasar'
import {initBackend} from 'absurd-sql/dist/indexeddb-main-thread'
// import { channel } from './relay'
const worker = new Worker(new URL('./query.worker.js', import.meta.url))
initBackend(worker)
// worker.postMessage({ name: 'setPort' }, [ channel.port2 ])
const hub = {}
// initializeDatabase()


worker.onmessage = ev => {
  // let { id, success, error, data, stream, type } = JSON.parse(ev.data)
  // let { id, success, error, data, stream, type } = ev.data
  let { id, success, error, data, stream, type, notice } = typeof ev.data === 'string' ? JSON.parse(ev.data) : ev.data

  if (type) {
    // console.debug(ev.data)
    return
  }

  if (notice) {
    Notify.create({
      message: `Relay ${notice.relay.url} says: ${notice.message}`,
      color: 'info'
    })
  }

  if (stream) {
    // console.debug('🖴', id, '~>>', data)
    if (hub[id]) hub[id](data)
    return
  }

  if (!success) {
    hub[id].reject(new Error(error))
    delete hub[id]
    return
  }

  // if (data) console.debug('🖴', id, '->', data)
  // console.log('🖴', id, '->', data)
  hub[id]?.resolve?.(data)
  delete hub[id]
}

function call(name, args) {
  let id = name + ' ' + Math.random().toString().slice(-4)
  // console.debug('🖴', id, '<-', args)
  // console.log('🖴', id, '<-', args)
  worker.postMessage({ id, name, args })
  // worker.postMessage(JSON.stringify({ id, name, args }))
  return new Promise((resolve, reject) => {
    hub[id] = { resolve, reject }
  })
}

function stream(name, args, callback) {
  let id = name + ' ' + Math.random().toString().slice(-4)
  hub[id] = callback
  // console.debug('db <-', id, args)
  worker.postMessage(JSON.stringify({ id, name, args, stream: true }))
  return {
    update(...args) {
      worker.postMessage(JSON.stringify({ id, name, args, stream: true }))
    },
    cancel() {
      worker.postMessage(JSON.stringify({ id, cancel: true }))
      delete hub[id]
    }
  }
}

// function sub(name, args) {
//   let id = name + ' ' + Math.random().toString().slice(-4)
//   // hub[id] = callback
//   console.debug('relay sub', id, args)
//   worker.postMessage(JSON.stringify({ id, name, args, sub: true }))
//   return {
//     update(...args) {
//       worker.postMessage(JSON.stringify({ id, name, args, sub: true }))
//     },
//     cancel() {
//       worker.postMessage(JSON.stringify({ id, cancel: true }))
//     }
//   }
// }

// async function initializeDatabase() {
//   return call('initializeDatabase', [])
// }
export async function destroyStreams() {
  return call('destroyStreams', [])
}

// export async function dbInit() {
//   return call('dbInit', [])
// }

// export async function dbClose() {
//   return call('dbClose', [])
// }

export async function dbErase() {
  return call('dbErase', [])
}

export async function dbSave(event) {
  return call('dbSave', [event])
}

export function dbStreamFeed(
  since = Math.round(Date.now() / 1000),
  callback = () => { }
) {
  return stream('dbStreamFeed', [since], callback)
}

export async function dbChats(pubkey) {
  return call('dbChats', [pubkey])
}

export async function dbMessages(userPubkey, peerPubkey, limit = 50, until = Math.round(Date.now() / 1000)) {
  return call('dbMessages', [userPubkey, peerPubkey, limit, until])
}

export async function streamUserMessages(pubkey, callback = () => { }) {
  return stream('streamUserMessages', [pubkey], callback)
}

export async function streamMessages(callback = () => { }) {
  return stream('streamMessages', [], callback)
}

export async function dbEvent(id) {
  return call('dbEvent', [id])
}

export async function dbStreamTagKind(type, value, kind, callback = () => { }) {
  return stream('dbStreamTagKind', [type, value, kind], callback)
}

// note abnormal behavior for dbStreamEvent
// for querying with one event id:
//  -by default will not create sub if event found in db
//  -extra 'updates' variable will create sub and push seen_on updates
//  -still need to manually cancel stream
// for querying with multiple event ids (normal behavior):
//  -stream kept open for all events
//  -no seen_on updates are pushed (even with updates = true)
export async function dbStreamEvent(id, callback = () => { }, updates = false) {
  return stream('dbStreamEvent', [id, updates], callback)
}

export async function dbMentions(pubkey, limit = 50, until = Math.round(Date.now() / 1000)) {
  return call('dbMentions', [pubkey, limit, until])
}

export function streamMentions(pubkey, callback = () => { }) {
  return stream('streamMentions', [pubkey], callback)
}

export async function dbUnreadMentionsCount(pubkey, since = Math.round(Date.now() / 1000)) {
  return call('dbUnreadMentionsCount', [pubkey, since])
}

export async function dbUnreadMessagesCount(userPubkey, peerPubkey, since = Math.round(Date.now() / 1000)) {
  return call('dbUnreadMessagesCount', [userPubkey, peerPubkey, since])
}

export async function dbUserProfile(pubkey) {
  return call('dbUserProfile', [pubkey])
}

export async function dbUserFollows(pubkey) {
  return call('dbUserFollows', [pubkey])
}

export async function dbUserNotes(pubkey, until = Math.round(Date.now() / 1000), limit = 50) {
  return call('dbUserNotes', [pubkey, until, limit])
}

export function streamUser(pubkey, callback = () => { }) {
  return stream('streamUser', [pubkey], callback)
}

export function streamUserNotes(pubkey, callback = () => { }) {
  return stream('streamUserNotes', [pubkey], callback)
}

export function streamUserProfile(pubkey, callback = () => { }) {
  return stream('streamUserProfile', [pubkey], callback)
}

export function dbStreamUserProfile(pubkey, callback = () => { }) {
  return stream('dbStreamUserProfile', [pubkey], callback)
}

export function streamUserFollows(pubkey, callback = () => { }) {
  return stream('dbStreamUserFollows', [pubkey], callback)
}

export function dbStreamUserFollows(pubkey, callback = () => { }) {
  return stream('dbStreamUserFollows', [pubkey], callback)
}

export function dbStreamUserFollowers(pubkey, callback = () => { }) {
  return stream('dbStreamUserFollowers', [pubkey], callback)
}

export function streamTag(type, value, callback = () => { }) {
  return stream('streamTag', [type, value], callback)
}

// export async function dbGetRelayForPubKey(pubkey) {
//   return call('dbGetRelayForPubKey', [pubkey])
// }

export async function prune(user, pubkeys) {
  return call('prune', [user, pubkeys])
}

export async function dbQuery(sql) {
  return call('dbQuery', [sql])
}

export function setRelays(relays) {
  return call('setRelays', [JSON.parse(JSON.stringify(relays))])
}

export function publish(event, relayURL) {
  return call('publish', [JSON.parse(JSON.stringify(event)), relayURL])
}

export function activateSub() {
  return call('activateSub', [])
}

export function deactivateSub() {
  return call('deactivateSub', [])
}

// export function relaySubUser(pubkey) {
//   return sub('relaySubUser', [pubkey])
// }

// export function relaySubUserNotes(pubkey) {
//   return sub('relaySubUserNotes', [pubkey])
// }

// export function relaySubUserInfo(pubkey) {
//   return sub('relaySubUserInfo', [pubkey])
// }

// export function relaySubTag(type, value) {
//   return sub('relaySubTag', [type, value])
// }

// export function relaySubFeed(since) {
//   return sub('relaySubFeed', [since])
// }

// export function relaySubEvent(id) {
//   return sub('relaySubEvent', [id])
// }

// export function relayUnsub() {
//   return call('relayUnsub', [])
// }

