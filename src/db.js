import {initBackend} from 'absurd-sql/dist/indexeddb-main-thread'

const worker = new Worker(new URL('./worker-db.js', import.meta.url))
const hub = {}

initBackend(worker)

worker.onmessage = ev => {
  let {id, success, error, data} = JSON.parse(ev.data)

  if (!success) {
    hub[id].reject(new Error(`${id}: ${error}`))
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

export async function eraseDatabase() {
  return call('eraseDatabase', [])
}
export async function dbSave(event, relay) {
  return call('dbSave', [event, relay])
}
export async function dbGetMentions(ourPubKey, limit = 40, since, until) {
  return call('dbGetMentions', [ourPubKey, limit, since, until])
}
export async function dbGetUnreadNotificationsCount(ourPubKey, since) {
  return call('dbGetUnreadNotificationsCount', [ourPubKey, since])
}
export async function dbGetMetaEvent(kind, pubkey) {
  return call('dbGetMetaEvent', [kind, pubkey])
}
export async function dbGetMetaEventSeen(kind, pubkey) {
  return call('dbGetMetaEventSeen', [kind, pubkey])
}
export async function dbExec(sql) {
  return call('dbExec', [sql])
}

window.sql = dbExec
