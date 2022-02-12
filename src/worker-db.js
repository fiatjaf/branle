/* global emit */

import PouchDB from 'pouchdb-core'
import PouchDBUpsert from 'pouchdb-upsert'
import PouchDBMapReduce from 'pouchdb-mapreduce'
import PouchDBAdapterIDB from 'pouchdb-adapter-idb'

import {cleanEvent} from './utils/event'

PouchDB.plugin(PouchDBAdapterIDB).plugin(PouchDBMapReduce).plugin(PouchDBUpsert)

// instantiate db (every doc will be an event, that's it)
// ~
const db = new PouchDB('nostr-events', {
  auto_compaction: true,
  revs_limit: 1
})

// db schema (views)
// ~
const DESIGN_VERSION = 7
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
          if (event.kind === 1 || event.kind === 2) {
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

const methods = {
  // delete everything
  //
  async eraseDatabase() {
    return await db.destroy()
  },

  // general function for saving an event, with granular logic for each kind
  //
  async dbSave(event, relay) {
    switch (event.kind) {
      case 0: {
        // first check if we don't have a newer metadata for this user
        let current = await methods.dbGetProfile(event.pubkey)
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
        let current = await methods.dbGetContactList(event.pubkey)
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
      await db.upsert(event.id, current => {
        if (
          (current.seen_on && current.seen_on.indexOf(relay) !== -1) ||
          !relay
        ) {
          // return falsey so the document won't be updated
          return false
        }

        // otherwise update with the relay this was seen on
        let updated = cleanEvent(event)
        updated.seen_on = current.seen_on || []
        updated.seen_on.push(relay)
        return updated
      })
    } catch (err) {
      console.error('unexpected error saving event', event, err)
    }
  },

  // db queries
  // ~
  async dbGetHomeFeedNotes(limit = 50, since = Math.round(Date.now() / 1000)) {
    let result = await db.query('main/homefeed', {
      include_docs: true,
      descending: true,
      limit,
      startkey: since
    })
    return result.rows.map(r => r.doc)
  },

  onNewHomeFeedNote(callback = () => {}) {
    let changes = db.changes({
      live: true,
      since: 'now',
      include_docs: true,
      filter: '_view',
      view: 'main/homefeed'
    })

    changes.on('change', change => callback(change.doc))

    return changes
  },

  async dbGetChats(ourPubKey) {
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
  },

  async dbGetMessages(
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
  },

  onNewMessage(peerPubKey, callback = () => {}) {
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
  },

  async dbGetEvent(id) {
    try {
      return await db.get(id)
    } catch (err) {
      if (err.name === 'not_found') return null
      else throw err
    }
  },

  onEventUpdate(id, callback = () => {}) {
    let changes = db.changes({
      live: true,
      since: 'now',
      include_docs: true,
      doc_ids: [id]
    })

    changes.on('change', change => callback(change.doc))

    return changes
  },

  async dbGetMentions(ourPubKey, limit = 40, since, until) {
    let result = await db.query('main/mentions', {
      include_docs: true,
      descending: true,
      startkey: [ourPubKey, until],
      endkey: [ourPubKey, since],
      limit
    })
    return result.rows.map(r => r.doc)
  },

  onNewMention(ourPubKey, callback = () => {}) {
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
  },

  onNewAnyMessage(callback = () => {}) {
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
  },

  async dbGetUnreadNotificationsCount(ourPubKey, since) {
    let result = await db.query('main/mentions', {
      include_docs: false,
      descending: true,
      startkey: [ourPubKey, {}],
      endkey: [ourPubKey, since]
    })
    return result.rows.length
  },

  async dbGetUnreadMessages(pubkey, since) {
    let result = await db.query('main/messages', {
      include_docs: false,
      descending: true,
      startkey: [pubkey, {}],
      endkey: [pubkey, since]
    })
    return result.rows.length
  },

  async dbGetProfile(pubkey) {
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
  },

  async dbGetContactList(pubkey) {
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
}

var streams = {}

self.onmessage = async function (ev) {
  let {name, args, id, stream, cancel} = JSON.parse(ev.data)

  if (stream) {
    let changes = methods[name](...args, data => {
      self.postMessage(
        JSON.stringify({
          id,
          data,
          stream: true
        })
      )
    })
    streams[id] = changes
  } else if (cancel) {
    streams[id].cancel()
    delete streams[id]
  } else {
    var reply = {id}
    try {
      let data = await methods[name](...args)
      reply.success = true
      reply.data = data
    } catch (err) {
      reply.success = false
      reply.error = err.message
    }

    self.postMessage(JSON.stringify(reply))
  }
}
