import initSqlJs from '@jlongster/sql.js'
import {SQLiteFS} from 'absurd-sql'
import IndexedDBBackend from 'absurd-sql/dist/indexeddb-backend'

import sqlWasm from '@jlongster/sql.js/dist/sql-wasm.wasm'

async function run() {
  // db is not initialized, collect all requests in a queue
  var queue = []
  self.onmessage = function (ev) {
    queue.push(ev)
  }

  let SQL = await initSqlJs({locateFile: () => sqlWasm})
  let sqlFS = new SQLiteFS(SQL.FS, new IndexedDBBackend())
  SQL.register_for_idb(sqlFS)

  SQL.FS.mkdir('/nostr')
  SQL.FS.mount(sqlFS, {}, '/nostr')

  const path = '/nostr/events.sqlite'
  if (typeof SharedArrayBuffer === 'undefined') {
    let stream = SQL.FS.open(path, 'a+')
    await stream.node.contents.readIfFallback()
    SQL.FS.close(stream)
  }

  let db = new SQL.Database(path, {filename: true})
  db.run(`
    PRAGMA journal_mode=MEMORY;
    PRAGMA page_size=8192;
    PRAGMA cache_size=5000;
    CREATE TABLE IF NOT EXISTS events (id TEXT PRIMARY KEY, pubkey TEXT, kind INTEGER, created_at INTEGER, content TEXT, tags_full TEXT, sig TEXT);
    CREATE TABLE IF NOT EXISTS tags (event_id TEXT, tag TEXT, value TEXT, UNIQUE(event_id, tag, value));
    CREATE TABLE IF NOT EXISTS seen (event_id TEXT, relay TEXT, UNIQUE(event_id, relay));
    CREATE INDEX IF NOT EXISTS events_by_kind ON events (kind, created_at);
    CREATE INDEX IF NOT EXISTS events_by_pubkey_kind ON events (pubkey, kind, created_at);
    CREATE UNIQUE INDEX IF NOT EXISTS tags_primary ON tags (event_id, tag);
    VACUUM;
  `)

  function handleMessage(ev) {
    let {name, args, id} = JSON.parse(ev.data)

    var reply = {id}
    try {
      let data = methods[name](...args)
      reply.success = true
      reply.data = data
    } catch (err) {
      reply.success = false
      reply.error = err.message
    }

    self.postMessage(JSON.stringify(reply))
  }

  const methods = {
    // delete everything
    //
    eraseDatabase() {
      return db.run(`
        DROP TABLE tags;
        DROP TABLE events;
        DROP TABLE seen;
      `)
    },

    // general function for saving an event, with granular logic for each kind
    //
    eventInsertStmt: db.prepare(
      `INSERT OR IGNORE INTO events (id, pubkey, kind, created_at, content, tags_full, sig) VALUES (:id, :pubkey, :kind, :created_at, :content, :tags_full, :sig)`
    ),
    tagsInsertStmt: db.prepare(
      `INSERT OR IGNORE INTO tags (event_id, tag, value) VALUES (:event_id, :tag, :value)`
    ),
    seenInsert: db.prepare(
      `INSERT OR IGNORE INTO seen (event_id, relay) VALUES (:event_id, :relay)`
    ),
    dbSave(event, relay) {
      db.run('BEGIN TRANSACTION')
      try {
        this.eventInsertStmt.run({
          ':id': event.id,
          ':pubkey': event.pubkey,
          ':kind': event.kind,
          ':created_at': event.created_at,
          ':content': event.content,
          ':tags_full': JSON.stringify(event.tags),
          ':sig': event.sig
        })
        event.tags
          .filter(tag => tag.length >= 2)
          .filter(tag => tag[0].length === 1)
          .forEach(tag =>
            this.tagsInsertStmt.run({
              ':event_id': event.id,
              ':tag': tag[0],
              ':value': tag[1]
            })
          )
        this.seenInsertStmt.run({':event_id': event.id, ':relay': relay})
        db.run('COMMIT')
      } catch (err) {
        db.run('ROLLBACK')
      }
    },

    // db queries
    // ~
    getHomeFeedNotesStmt: db.prepare(`
      SELECT * FROM events
      WHERE kind = 1 AND created_at <= :since
      ORDER BY created_at DESC
      LIMIT :limit
    `),
    dbGetHomeFeedNotes(limit = 50, since = Math.round(Date.now() / 1000)) {
      this.getHomeFeedNotesStmt.bind({':limit': limit, ':since': since})
      var events = []
      while (this.getHomeFeedNotesStmt.step()) {
        events.push(eventFromRow(this.getHomeFeedNotesStmt.get()))
      }
      this.getHomeFeedNotesStmt.reset()
      return events
    },

    getEventStmt: db.prepare(`SELECT * FROM events WHERE id = :id`),
    dbGetEvent(id) {
      try {
        let event = eventFromRow(this.getEventStmt.get({':id': id}))
        this.getEventStmt.reset()
        return event
      } catch (err) {
        return null
      }
    },

    getMentionsStmt: db.prepare(`
      SELECT * FROM events
      INNER JOIN tags ON tags.event_id = events.id
      WHERE tags.tag = 'p' AND tags.value = :ourPubKey
        AND kind = 1
        AND created_at > :since
        AND created_at < :until
        LIMIT :limit
    `),
    dbGetMentions(
      ourPubKey,
      limit = 40,
      since = Math.round(Date.now() / 1000) - 60 * 60 * 24 * 360,
      until = Math.round(Date.now() / 1000)
    ) {
      try {
        this.getMentionsStmt.bind({':ourPubKey': ourPubKey, ':since': since})
        var events = []
        while (this.getMentionsStmt.step()) {
          events.push(eventFromRow(this.getMentionsStmt.get()))
        }
        this.getMentionsStmt.reset()
        return events
      } catch (err) {
        return []
      }
    },

    getUnreadNotificationsCountStmt: db.prepare(`
      SELECT count(*) FROM events
      INNER JOIN tags ON tags.event_id = events.id
      WHERE tags.tag = 'p' AND tags.value = :ourPubKey
        AND kind = 1
        AND created_at > :since
    `),
    dbGetUnreadNotificationsCount(ourPubKey, since) {
      let results = this.getUnreadNotificationsCountStmt.get({
        ':ourPubKey': ourPubKey,
        ':since': since
      })
      this.getUnreadNotificationsCountStmt.reset()
      return results.length > 0 ? results[0] : 0
    },

    getProfileStmt: db.prepare(
      `SELECT * FROM events WHERE pubkey = :pubkey AND kind = 0`
    ),
    dbGetProfile(pubkey) {
      try {
        let event = eventFromRow(this.getProfileStmt.get({':pubkey': pubkey}))
        this.getProfileStmt.reset()
        return event
      } catch (err) {
        return null
      }
    },

    getContactListStmt: db.prepare(`
      SELECT * FROM events
      WHERE pubkey = :pubkey
        AND kind = 3
    `),
    dbGetContactList(pubkey) {
      try {
        let event = eventFromRow(this.getProfileStmt.get({':pubkey': pubkey}))
        this.getContactListStmt.reset()
        return event
      } catch (err) {
        return null
      }
    },

    dbExec(sql, params = []) {
      return db.exec(sql, params)
    }
  }

  // db is initialized now, execute all in the query and run them immediately from here onwards
  self.onmessage = handleMessage
  queue.forEach(ev => handleMessage(ev))
  queue = null
}

function eventFromRow(row) {
  return {
    id: row[0],
    pubkey: row[1],
    kind: row[2],
    created_at: row[3],
    content: row[4],
    tags: JSON.parse(row[5]),
    sig: row[6]
  }
}

run()
