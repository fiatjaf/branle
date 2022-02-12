const worker = new Worker(new URL('./worker-db.js', import.meta.url))

const hub = {}

worker.onmessage = ev => {
  let {id, success, error, data, stream} = JSON.parse(ev.data)

  if (stream) {
    console.debug('🖴', id, '~>>', data)
    hub[id](data)
    return
  }

  if (!success) {
    hub[id].reject(new Error(error))
    delete hub[id]
    return
  }

  if (data) console.debug('🖴', id, '->', data)
  hub[id]?.resolve?.(data)
  delete hub[id]
}

function call(name, args) {
  let id = name + ' ' + Math.random().toString().slice(-4)
  console.debug('🖴', id, '<-', args)
  worker.postMessage(JSON.stringify({id, name, args}))
  return new Promise((resolve, reject) => {
    hub[id] = {resolve, reject}
  })
}

function stream(name, args, callback) {
  let id = name + ' ' + Math.random().toString().slice(-4)
  hub[id] = callback
  console.debug('db <-', id, args)
  worker.postMessage(JSON.stringify({id, name, args, stream: true}))
  return {
    cancel() {
      worker.postMessage(JSON.stringify({id, cancel: true}))
    }
  }
}

export async function eraseDatabase() {
  return call('eraseDatabase', [])
}
export async function dbSave(event, relay) {
  return call('dbSave', [event, relay])
}
export async function dbGetHomeFeedNotes(
  limit = 50,
  since = Math.round(Date.now() / 1000)
) {
  return call('dbGetHomeFeedNotes', [limit, since])
}
export function onNewHomeFeedNote(callback = () => {}) {
  return stream('onNewHomeFeedNote', [], callback)
}
export async function dbGetChats(ourPubKey) {
  return call('dbGetChats', [ourPubKey])
}
export async function dbGetMessages(
  peerPubKey,
  limit = 50,
  since = Math.round(Date.now() / 1000)
) {
  return call('dbGetMessages', [peerPubKey, limit, since])
}
export function onNewMessage(peerPubKey, callback = () => {}) {
  return stream('onNewMessage', [peerPubKey], callback)
}
export async function dbGetEvent(id) {
  return call('dbGetEvent', [id])
}
export async function onEventUpdate(id, callback = () => {}) {
  return stream('onEventUpdate', [id], callback)
}
export async function dbGetMentions(ourPubKey, limit = 40, since, until) {
  return call('dbGetMentions', [ourPubKey, limit, since, until])
}
export function onNewMention(ourPubKey, callback = () => {}) {
  return stream('onNewMention', [ourPubKey], callback)
}
export function onNewAnyMessage(callback = () => {}) {
  return stream('onNewAnyMessage', [], callback)
}
export async function dbGetUnreadNotificationsCount(ourPubKey, since) {
  return call('dbGetUnreadNotificationsCount', [ourPubKey, since])
}
export async function dbGetUnreadMessages(pubkey, since) {
  return call('dbGetUnreadMessages', [pubkey, since])
}
export async function dbGetProfile(pubkey) {
  return call('dbGetProfile', [pubkey])
}
export async function dbGetContactList(pubkey) {
  return call('dbGetContactList', [pubkey])
}
export async function dbGetRelayForPubKey(pubkey) {
  return call('dbGetRelayForPubKey', [pubkey])
}
