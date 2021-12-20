/* global emit */

import PouchDB from 'pouchdb-core'
import PouchDBUpsert from 'pouchdb-upsert'
import PouchDBMapReduce from 'pouchdb-mapreduce'
import PouchDBAdapterIDB from 'pouchdb-adapter-idb'

PouchDB.plugin(PouchDBAdapterIDB).plugin(PouchDBMapReduce).plugin(PouchDBUpsert)

// instantiate db (every doc will be an event, that's it)
// ~
export const db = new PouchDB('nostr-events', {
  auto_compaction: true,
  revs_limit: 1
})

// db schema (views)
// ~
const DESIGN_VERSION = 1
db.upsert('_design/main', current => {
  if (current.version >= DESIGN_VERSION) return false

  return {
    version: DESIGN_VERSION,
    views: {
      profiles: {
        map: function (event) {
          if (event.kind === 0) {
            emit(event.pubkey)
          }
        }.toString()
      },
      homefeed: {
        map: function (event) {
          if (event.kind === 1) {
            emit(event.created_at)
          }
        }.toString()
      },
      mentions: {
        map: function (event) {
          if (event.kind === 1) {
            for (var i = 0; i < event.tags.length; i++) {
              var tag = event.tags[i]
              if (tag[0] === 'p') emit([tag[1], event.created_at])
              if (tag[0] === 'e') emit([tag[1], event.created_at])
            }
          }
        }.toString()
      },
      messages: {
        map: function (event) {
          if (event.kind === 4) {
            for (var i = 0; i < event.tags.length; i++) {
              var tag = event.tags[i]
              if (tag[0] === 'p') {
                emit([tag[1], event.created_at])
                break
              }
            }
            emit([event.pubkey, event.created_at])
          }
        }.toString()
      }
    }
  }
}).then(() => {
  db.viewCleanup().then(r => console.log('view cleanup done', r))
})

// general function for saving an event, with granular logic for each kind
//
export async function dbSave(event) {
  switch (event.kind) {
    case 0: {
      // first check if we don't have a newer metadata for this user
      let current = await dbGetProfile(event.pubkey)
      if (current.created_at >= event.created_at) {
        return
      }
      break
    }
    case 1:
      break
    case 2:
      break
    case 3:
      break
    case 4:
      break
  }

  event._id = event.id

  try {
    await db.put(event)
  } catch (err) {
    if (err.name !== 'conflict') {
      console.error('unexpected error saving event', event, err)
    }
  }
}

// db queries
// ~
export async function dbGetHomeFeedNotes(
  limit = 50,
  since = Math.round(Date.now() / 1000)
) {
  let result = await db.query('main/homefeed', {
    include_docs: true,
    descending: true,
    limit,
    startkey: since
  })
  return result.rows.map(r => r.doc)
}

export function onNewHomeFeedNote(onNewEvent = () => {}) {
  // listen for changes
  let changes = db.changes({
    live: true,
    since: 'now',
    include_docs: true,
    filter: '_view',
    view: 'main/homefeed'
  })

  changes.on('change', change => onNewEvent(change.doc))

  return changes
}

export async function dbGetChats(ourPubKey) {
  let result = await db.query('main/messages')

  let chats = result.rows
    .map(r => r.key)
    .reduce((acc, [peer, date]) => {
      acc[peer] = acc[peer] || 0
      if (date > acc[peer]) acc[peer] = date
      return acc
    }, {})

  delete chats[ourPubKey]

  return Object.entries(chats)
    .sort((a, b) => b[1] - a[1])
    .map(([peer, lastMessage]) => ({peer, lastMessage}))
}

export async function dbGetMessages(
  peerPubKey,
  limit = 50,
  since = Math.round(Date.now() / 1000)
) {
  let result = await db.query('main/messages', {
    include_docs: true,
    descending: true,
    startkey: [peerPubKey, since],
    endkey: [peerPubKey, 0],
    limit
  })
  return result.rows
    .map(r => r.doc)
    .reverse()
    .reduce((acc, event) => {
      if (!acc.length) return [event]
      let last = acc[acc.length - 1]
      if (
        last.pubkey === event.pubkey &&
        last.created_at + 120 >= event.created_at
      ) {
        last.combination = last.combination || [last]
        last.combination.push(event)
      } else {
        acc.push(event)
      }
      return acc
    }, [])
}

export function onNewMessage(peerPubKey, onNewEvent = () => {}) {
  // listen for changes
  let changes = db.changes({
    live: true,
    since: 'now',
    include_docs: true,
    filter: '_view',
    view: 'main/messages'
  })

  changes.on('change', change => {
    if (
      change.doc.pubkey === peerPubKey ||
      change.doc.tags.find(([t, v]) => t === 'p' && v === peerPubKey)
    ) {
      onNewEvent(change.doc)
    }
  })

  return changes
}

export async function dbGetEvent(id) {
  return await db.get(id)
}

export async function dbGetMentions(ourPubKey, limit = 20, skip = 0) {
  let result = await db.query('main/mentions', {
    include_docs: true,
    descending: true,
    startkey: [ourPubKey, {}],
    endkey: [ourPubKey],
    limit,
    skip
  })
  return result.rows.map(r => r.doc)
}

export async function dbGetProfile(pubkey) {
  let result = await db.query('main/profiles', {
    include_docs: true,
    key: pubkey
  })
  switch (result.rows.length) {
    case 0:
      return null
    case 1:
      return result.rows[0].doc
    default: {
      let sorted = result.rows.sort(
        (a, b) => (b.doc?.created_at || 0) - (a.doc?.created_at || 0)
      )
      sorted
        .slice(1)
        .filter(row => row.doc)
        .forEach(row => db.remove(row.doc))
      return sorted[0].doc
    }
  }
}
