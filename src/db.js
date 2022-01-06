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
window.db = db

// db schema (views)
// ~
const DESIGN_VERSION = 3
db.upsert('_design/main', current => {
  if (current && current.version >= DESIGN_VERSION) return false

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
      },
      contactlists: {
        map: function (event) {
          if (event.kind === 3) {
            emit(event.pubkey)
          }
        }.toString()
      },
      followers: {
        map: function (event) {
          if (event.kind === 3) {
            for (let i = 0; i < event.tags.length; i++) {
              var tag = event.tags[i]
              if (tag.length >= 2 && tag[0] === 'p') {
                emit(tag[1], event.pubkey)
              }
            }
          }
        }.toString()
      },
      petnames: {
        map: function (event) {
          if (event.kind === 3) {
            for (let i = 0; i < event.tags.length; i++) {
              var tag = event.tags[i]
              if (tag.length >= 4 && tag[0] === 'p') {
                emit(tag[1], [event.pubkey, tag[3]])
              }
            }
          }
        }.toString()
      }
    }
  }
}).then(() => {
  // cleanup old views after a design doc change
  db.viewCleanup().then(r => console.log('view cleanup done', r))
})

// delete old events after the first 1000 (this is slow, so do it after a while)
//
setTimeout(async () => {
  let result = await db.query('main/homefeed', {
    descending: true,
    skip: 1000,
    include_docs: true
  })
  result.rows.forEach(row => db.remove(row.doc))
}, 1000 * 60 * 15 /* 15 minutes */)

// general function for saving an event, with granular logic for each kind
//
export async function dbSave(event) {
  switch (event.kind) {
    case 0: {
      // first check if we don't have a newer metadata for this user
      let current = await dbGetProfile(event.pubkey)
      if (current && current.created_at >= event.created_at) {
        // don't save
        return
      }
      break
    }
    case 1:
      break
    case 2:
      break
    case 3: {
      // first check if we don't have a newer contact list for this user
      let current = await dbGetContactList(event.pubkey)
      if (current && current.created_at >= event.created_at) {
        // don't save
        return
      }
      break
    }
    case 4: {
      // cleanup extra fields if somehow they manage to get in here (they shouldn't)
      delete event.appended
      delete event.plaintext
      break
    }
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

  //Get doc-uments from pouchdb result
  let events = result.rows.map(r => r.doc)

  //Nest replies, result like this:
  //Event     !isReply
  //  Event   isReply
  //  Event   isReply
  //Event     !isReply
  events = toEventTree(events)

  //Filter out unnested replies
  return events
}

function toEventTree(flatList) {
  var map = {},
    node,
    roots = [],
    i

  for (i = 0; i < flatList.length; i += 1) {
    map[flatList[i].id] = i //Initialize the map
    flatList[i].replies = [] //Initialize the children
  }

  for (i = 0; i < flatList.length; i += 1) {
    node = flatList[i]
    const parents = node.tags.filter(t => t[0] === 'e')
    node.isReply = !!parents.length
    node.isReplyToReply = parents.length > 1
    let parent
    if (node.isReply) {
      node.root = parents[0][1]
      parent = parents.pop()
      //If you have dangling branches check that map[parent] exists
      flatList[map[parent[1]]].replies.push(node)
      flatList[map[parent[1]]].replies.sort(
        (a, b) => a.created_at - b.created_at
      )
    } else {
      roots.push(node)
    }
  }
  return roots
}

export function onNewHomeFeedNote(callback = () => {}) {
  // listen for changes
  let changes = db.changes({
    live: true,
    since: 'now',
    include_docs: true,
    filter: '_view',
    view: 'main/homefeed'
  })

  changes.on('change', change => callback(change.doc))

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
        last.appended = last.appended || []
        last.appended.push(event)
      } else {
        acc.push(event)
      }
      return acc
    }, [])
}

export function onNewMessage(peerPubKey, callback = () => {}) {
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
      callback(change.doc)
    }
  })

  return changes
}

export async function dbGetEvent(id) {
  try {
    return await db.get(id)
  } catch (err) {
    if (err.name === 'not_found') return null
    else throw err
  }
}

export async function dbGetMentions(ourPubKey, limit = 40, since, until) {
  let result = await db.query('main/mentions', {
    include_docs: true,
    descending: true,
    startkey: [ourPubKey, until],
    endkey: [ourPubKey, since],
    limit
  })
  return result.rows.map(r => r.doc)
}

export function onNewMention(ourPubKey, callback = () => {}) {
  // listen for changes
  let changes = db.changes({
    live: true,
    since: 'now',
    include_docs: true,
    filter: '_view',
    view: 'main/mentions'
  })

  changes.on('change', change => {
    if (change.doc.tags.find(([t, v]) => t === 'p' && v === ourPubKey)) {
      callback(change.doc)
    }
  })

  return changes
}

export function onNewAnyMessage(callback = () => {}) {
  // listen for changes
  let changes = db.changes({
    live: true,
    since: 'now',
    include_docs: true,
    filter: '_view',
    view: 'main/messages'
  })

  changes.on('change', change => {
    callback(change.doc)
  })

  return changes
}

export async function dbGetUnreadNotificationsCount(ourPubKey, since) {
  let result = await db.query('main/mentions', {
    include_docs: false,
    descending: true,
    startkey: [ourPubKey, {}],
    endkey: [ourPubKey, since]
  })
  return result.rows.length
}

export async function dbGetUnreadMessages(pubkey, since) {
  let result = await db.query('main/messages', {
    include_docs: false,
    descending: true,
    startkey: [pubkey, {}],
    endkey: [pubkey, since]
  })
  return result.rows.length
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

export async function dbGetContactList(pubkey) {
  let result = await db.query('main/contactlists', {
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
