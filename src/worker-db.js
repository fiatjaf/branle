import initSqlJs from '@jlongster/sql.js'
import {SQLiteFS} from 'absurd-sql'
import IndexedDBBackend from 'absurd-sql/dist/indexeddb-backend'

import sqlWasm from '@jlongster/sql.js/dist/sql-wasm.wasm'

async function run() {
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
  db.exec(`
    PRAGMA journal_mode=MEMORY;
    PRAGMA page_size=8192;
    PRAGMA cache_size=5000;
    CREATE TABLE IF NOT EXISTS events (id TEXT PRIMARY KEY, pubkey TEXT, kind INTEGER, created_at INTEGER, content TEXT, tags_full TEXT, sig TEXT);
    CREATE TABLE IF NOT EXISTS tags (event_id TEXT, tag TEXT, value TEXT);
    CREATE INDEX IF NOT EXISTS events_by_kind ON events (kind, created_at);
    CREATE INDEX IF NOT EXISTS events_by_pubkey_kind ON events (pubkey, kind, created_at);
    CREATE UNIQUE INDEX IF NOT EXISTS tags_primary ON tags (event_id, tag);
  `)

  self.onmessage = async function (ev) {
    let {name, args, id} = JSON.parse(ev.data)

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

  const methods = {
    // delete everything
    //
    async eraseDatabase() {
      return await db.exec(`
        DROP TABLE tags;
        DROP TABLE events;
      `)
    },

    // general function for saving an event, with granular logic for each kind
    //
    async dbSave(event, relay) {
      let eventInsert = `INSERT INTO events (id, pubkey, kind, created_at, content, tags_full, sig) VALUES ('${
        event.id
      }', '${event.pubkey}', ${event.kind}, ${event.created_at}, '${
        event.content
      }', '${JSON.stringify(event.tags)}', '${event.sig}');`

      let tagsInsert = event.tags
        .filter(tag => tag.length >= 2)
        .map(
          tag =>
            `INSERT INTO tags (event_id, tag, value) VALUES ('${event.id}', '${tag[0]}', '${tag[1]}');`
        )
        .join('')

      await db.exec(eventInsert + tagsInsert)
    },

    // db queries
    // ~
    async dbGetHomeFeedNotes(
      limit = 50,
      since = Math.round(Date.now() / 1000)
    ) {
      let results = await db.exec(`
        SELECT * FROM events
        WHERE kind = 1 AND created_at >= ${since}
        ORDER BY created_at DESC
        LIMIT ${limit}
      `)

      return results.flatMap(result => result.values.map(eventFromRow))
    },

    async dbGetEvent(id) {
      let results = await db.exec(`
        SELECT * FROM events
        WHERE id = '${id}'
      `)

      return results.flatMap(result => result.values.map(eventFromRow))[0]
    },

    async dbGetMentions(ourPubKey, limit = 40, since, until) {
      let results = await db.exec(`
        SELECT * FROM events
        INNER JOIN tags ON tags.event_id = events.id
        WHERE tags.tag = 'p' AND tags.value = '${ourPubKey}'
          AND kind = 1
          AND created_at > ${since}
      `)

      return results.flatMap(result => result.values.map(eventFromRow))
    },

    async dbGetUnreadNotificationsCount(ourPubKey, since) {
      let results = await db.exec(`
        SELECT count(*) FROM events
        INNER JOIN tags ON tags.event_id = events.id
        WHERE tags.tag = 'p' AND tags.value = '${ourPubKey}'
          AND kind = 1
          AND created_at > ${since}
      `)

      return results.flatMap(result =>
        result.values.length > 0 ? result.values[0][0] : 0
      )[0]
    },

    async dbGetProfile(pubkey) {
      let results = await db.exec(`
        SELECT * FROM events
        WHERE pubkey = '${pubkey}'
          AND kind = 0
      `)

      return results.flatMap(result => result.values.map(eventFromRow))[0]
    },

    async dbGetContactList(pubkey) {
      let results = await db.exec(`
        SELECT * FROM events
        WHERE pubkey = '${pubkey}'
          AND kind = 3
      `)

      return results.flatMap(result => result.values.map(eventFromRow))[0]
    }
  }
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
