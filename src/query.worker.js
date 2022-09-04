self.process = {env: {}}

import * as relay from './relay'
import { matchFilter } from 'nostr-tools'
import initSqlJs from '@jlongster/sql.js'
import { SQLiteFS } from 'absurd-sql'
import IndexedDBBackend from 'absurd-sql/dist/indexeddb-backend'
import sqlWasm from '@jlongster/sql.js/dist/sql-wasm.wasm'


export var channel = new MessageChannel()
// worker.postMessage({ name: 'setPort' }, [ channel.port1 ])
relay.setPort(channel)

let relayWorkerPort = channel.port1
// relayWorkerPort = ev.ports[0]
// relayWorker.addEventListener('message', e => {
// relayWorker.onmessage = ev => {
relayWorkerPort.onmessage = ev => {
  switch (ev.data.type) {
    case 'events': {
      saveEventsToDb(ev.data.events)
      break
    }
    case 'notice': {
      self.postMessage({
        notice: {
          message: ev.data.notice,
          relay: ev.data.relay
        }
      })
      break
    }
    default: {
      output(ev.data)
      break
    }
  }
}

// delete pouchdb indexeddbs
indexedDB.databases().then(dbs => {
  if (dbs.length <= 1) return
  for (let db of dbs) {
    if (db.name.includes('_pouch_nostr-events'))
      indexedDB.deleteDatabase(db.name)
  }
})

let currentBackendType = 'idb'
let cacheSize = 2000
let pageSize = 8192
const dbName = `events.absurd-sql`
const path = `/nostr/${dbName}`
let SQL = null
// let recordProfile = false;
// let useRawIDB = false;

// let memoryBackend = new MemoryBackend({});
let idbBackend = new IndexedDBBackend(() => {
  console.error('Unable to write!')
})

var db = null
// getDb(db)

// let relayWorker = new Worker(new URL('./relay.worker.js', import.meta.url))
// let relays;

// let debouncedDbSave = mergebounce(
//   events => saveEventsToDb(events),
//   500,
//   { 'concatArrays': true, 'promise': true }
// )
// // relayWorker.addEventListener('message', e => {
// // relayWorker.onmessage = ev => {
// relayWorkerPort.onmessage = ev => {
//   switch (ev.data.type) {
//     case 'event': {
//       // consolvlog(e.data);
//       debouncedDbSave([ev.data])
//       // lastSave = Date.now();
//       break
//     }
//     default: {
//       output(ev.data)
//       break
//     }
//   }
// }

// Helper methods
function output(msg) {
  // self.postMessage({ output: msg })
  console.log(msg)
}

// function getPageSize(db) {
//   let stmt = db.prepare('PRAGMA page_size')
//   stmt.step()
//   let row = stmt.getAsObject()
//   stmt.free()
//   return row.page_size
// }
// instead of creating this function, import dbGetRelayForPubKey from db.js
// function getRelays(pubkey) {
//   let event = queryDb(`
//     SELECT event LIMIT 1
//     FROM nostr
//     WHERE json_extract(event,'$.kind') = 3
//   `)
// }


// async function getDb() {
//   await initDb()
//   // if (db == null) {
//     console.log('db is null')
//     if (typeof SharedArrayBuffer === 'undefined') {
//       let stream = SQL.FS.open(path, 'a+')
//       await stream.node.contents.readIfFallback()
//       SQL.FS.close(stream)
//     }

//     db = new SQL.Database(path, { filename: true })

//     // Should ALWAYS use the journal in memory mode. Doesn't make
//     // any sense at all to write the journal. It's way slower
//     // db.exec(`
//     //   PRAGMA cache_size=-${cacheSize};
//     //   PRAGMA journal_mode=MEMORY;
//     //   PRAGMA page_size=${pageSize};
//     // `)
//     db.run(`
//       PRAGMA cache_size=-${cacheSize};
//       PRAGMA journal_mode=MEMORY;
//       PRAGMA page_size=${pageSize};
//       VACUUM;
//     `)
//     output(`Opened ${dbName} (${currentBackendType}) cache size: ${cacheSize}`)
//   // }

//   setupDb(db)

//   return db
// }

async function initDb() {
  // if (SQL == null) {
    SQL = await initSqlJs({ locateFile: () => sqlWasm })
    let sqlFS = new SQLiteFS(SQL.FS, idbBackend)
    SQL.register_for_idb(sqlFS)
    if (typeof SharedArrayBuffer === 'undefined') {
      output(
        '<code>SharedArrayBuffer</code> is not available in your browser. Falling back.'
      )
    }

    SQL.FS.mkdir('/nostr')
    SQL.FS.mount(sqlFS, {}, '/nostr')
    // }
    if (typeof SharedArrayBuffer === 'undefined') {
      let stream = SQL.FS.open(path, 'a+')
      await stream.node.contents.readIfFallback()
      SQL.FS.close(stream)
    }

    db = new SQL.Database(path, { filename: true })
    db.run(`
      PRAGMA cache_size=-${cacheSize};
      PRAGMA journal_mode=MEMORY;
      PRAGMA page_size=${pageSize};
      VACUUM;
    `)
    output(`Opened ${dbName} (${currentBackendType}) cache size: ${cacheSize}`)

    createTables(db)
    return
}

// function setupDb(db) {
//   createTables(db)

//   // let curPageSize = getPageSize(db)

//   // if (curPageSize !== pageSize) {
//   //   output('Page size has changed, running VACUUM to restructure db')
//   //   db.exec('VACUUM')
//   //   // Vacuuming resets the cache size, so set it back
//   //   db.exec(`PRAGMA cache_size=-${cacheSize}`)
//   //   output(`Page size is now ${getPageSize(db)}`)
//   // }
// }


// export function matchFilter(filter, event) {
//   console.log('matchFilter', filter, event, event.kind === 4)
//   if (filter.ids && filter.ids.indexOf(event.id) === -1) return false
//   if (filter.kinds && filter.kinds.indexOf(event.kind) === -1) return false
//   if (filter.authors && filter.authors.indexOf(event.pubkey) === -1)
//     return false

//   for (let f in filter) {
//     if (f[0] === '#') {
//       if (
//         filter[f] &&
//         !event.tags.find(
//           ([t, v]) => t === f.slice(1) && filter[f].indexOf(v) !== -1
//         )
//       )
//         return false
//     }
//   }

//   if (filter.since && event.created_at < filter.since) return false
//   if (filter.until && event.created_at >= filter.until) return false

//   return true
// }

function handleInsertedEvent(event) {
  event = JSON.parse(event)
  for (let id in streams) {
    try {
      let callback = streams[id].callback
      if (matchFilter(streams[id].filter, event) && callback) callback(event)
    } catch (err) {
      console.log('error', err, id, streams)
    }
  }
}

function handleUpdatedEvent(event) {
  event = JSON.parse(event)
  for (let id in streams) {
    if (id.split(' ')[0] === 'dbStreamEvent' && streams[id].filter.ids.length === 1) {
      try {
        // console.log('stream event passed', id, streams, matchFilter(streams[id].filter, event))
        let callback = streams[id].callback
        if (matchFilter(streams[id].filter, event) && callback) callback(event)
      } catch (err) {
        console.log('error', err, id, streams)
      }
    }
  }
}

function createTables(db, output = console.log) {
  console.log('creating tables and indexes')
  db.create_function('handleInsertedEvent', event => {
    handleInsertedEvent(event)
  })
  db.create_function('handleUpdatedEvent', event => {
    handleUpdatedEvent(event)
  })
  db.exec(`
    BEGIN TRANSACTION;
    CREATE TABLE IF NOT EXISTS nostr (
      id TEXT PRIMARY KEY,
      event TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_kind_created_at ON nostr (json_extract(event,'$.kind'), json_extract(event,'$.created_at') DESC);
    CREATE INDEX IF NOT EXISTS idx_kind_pubkey_created_at ON nostr (json_extract(event,'$.kind'), json_extract(event,'$.pubkey'), json_extract(event,'$.created_at') DESC);

    CREATE TABLE IF NOT EXISTS idx_kind_tag_created_at (
      kind INTEGER NOT NULL,
      tag TEXT NOT NULL,
      created_at INTEGER NOT NULL,
      id TEXT NOT NULL,
      pubkey TEXT NOT NULL,
      PRIMARY KEY(kind, tag, created_at, id)
      );
    CREATE TRIGGER IF NOT EXISTS nostr_tags_after_insert AFTER INSERT ON nostr
      WHEN json_array_length(json_extract(new.event,'$.tags')) > 0
      BEGIN
        INSERT OR IGNORE INTO idx_kind_tag_created_at (kind, tag, created_at, id, pubkey)
        SELECT DISTINCT json_extract(new.event, '$.kind'),
          lower(iif(
            instr(substr(tag.value, instr(tag.value, ',') + 1), ','),
            substr(tag.value, 1, instr(tag.value, ',') + instr(substr(tag.value, instr(tag.value, ',') + 1), ',') - 1)||']',
            tag.value
          )),
          json_extract(new.event, '$.created_at'),
          new.id,
          json_extract(new.event, '$.pubkey')
        FROM json_each(json_extract(new.event, '$.tags')) AS tag;
      END;
    CREATE TRIGGER IF NOT EXISTS nostr_tags_after_delete AFTER DELETE ON nostr
      WHEN json_array_length(json_extract(old.event,'$.tags')) > 0
      BEGIN
        DELETE FROM idx_kind_tag_created_at
        WHERE kind = json_extract(old.event,'$.kind') AND
          tag in (
            SELECT lower(iif(
                instr(substr(tag.value, instr(tag.value, ',') + 1), ','),
                substr(tag.value, 1, instr(tag.value, ',') + instr(substr(tag.value, instr(tag.value, ',') + 1), ',') - 1)||']',
                tag.value
              ))
            FROM json_each(json_extract(old.event,'$.tags')) AS tag
          ) AND
          created_at = json_extract(old.event,'$.created_at') AND
          id = old.id;
      END;
    CREATE TRIGGER IF NOT EXISTS nostr_after_insert AFTER INSERT ON nostr
      BEGIN
        SELECT handleInsertedEvent(new.event) AS '';
      END;
    CREATE TRIGGER IF NOT EXISTS nostr_after_update AFTER UPDATE ON nostr
      BEGIN
        SELECT handleUpdatedEvent(new.event) AS '';
      END;
    CREATE VIEW IF NOT EXISTS nostr_events AS
      SELECT id,
        json_extract(event,'$.pubkey') pubkey,
        json_extract(event,'$.created_at') created_at,
        json_extract(event,'$.kind') kind,
        json_extract(event,'$.tags') tags,
        json_extract(event,'$.content') content,
        json_extract(event,'$.seen_on') seen_on,
        json_extract(event,'$.first_seen') first_seen,
        json_extract(event,'$.last_updated') last_updated
        FROM nostr;
    CREATE VIEW IF NOT EXISTS nostr_users AS
      SELECT json_extract(event,'$.pubkey') pubkey,
        json_extract(json_extract(event,'$.content'),'$.name') name,
        json_extract(json_extract(event,'$.content'),'$.picture') picture,
        json_extract(json_extract(event,'$.content'),'$.about') about,
        json_extract(json_extract(event,'$.content'),'$.nip05') nip05,
        CASE (ROW_NUMBER() OVER (
            PARTITION BY json_extract(event,'$.pubkey')
            ORDER BY json_extract(event,'$.created_at') DESC
          ))
          WHEN 1 THEN 1
          ELSE 0
          END is_current,
        json_extract(event,'$.created_at') created_at,
        json_extract(event,'$.seen_on') seen_on
      FROM nostr
      WHERE json_extract(event,'$.kind') = 0;
    COMMIT;`
  )
  output('Done')
}

function queryDb(sql) {
  let stmt = db.prepare(sql)
  let rows = []
  while (stmt.step()) {
    rows.push(stmt.getAsObject())
  }
  stmt.free()
  return rows
  // return rows.length === 1 ? rows[0] : rows
  // self.postMessage({
  //   type: 'query-results',
  //   data: rows,
  //   id: msg.data.id
  // });
}

function closeDb() {
  if (db) {
    output(`Closed db`)
    db.close()
    db = null
  }
}

function saveEventsToDb(events, output = console.log, outputTiming = console.log) {
  let start = Date.now()
  console.debug(`saving ${events.length} events...`)
  db.exec(`BEGIN TRANSACTION;
  `)

  let stmt = db.prepare(`
  INSERT INTO nostr (id, event)
    VALUES(?, ?)
    ON CONFLICT(id) DO UPDATE SET
    event=json_set(
      event,
      '$.seen_on',json_insert(json_extract(event,'$.seen_on'),'$[#]',json_extract(excluded.event,'$.seen_on[0]')),
      '$.last_updated',json_extract(excluded.event,'$.last_updated')
    )
    WHERE INSTR(json_extract(event,'$.seen_on'), json_extract(excluded.event,'$.seen_on[0]')) = 0;
    `)
  for (let i = 0; i < events.length; i++) {
    let event = events[i].event
    if (event.created_at > Math.round(Date.now() / 1000)) continue
    let relay = events[i].relay
    event.first_seen = Math.round(Date.now() / 1000)
    event.last_updated = Math.round(Date.now() / 1000)
    event.seen_on = []
    if (relay) event.seen_on.push(relay)
    event.tags = event.tags.map(tag => tag.map(element => element.toLowerCase()))
    stmt.run([event.id, JSON.stringify(event)])
  }
  db.exec('COMMIT')
  stmt.free()
  let took = Date.now() - start
  console.debug('Done! Took: ' + took + ` for ${events.length} events`)
  return events
  // output('events inserted: ' + JSON.stringify(events));
  // outputTiming(took);
}

function cancelStream(id) {
  if (streams[id]?.sub) streams[id].sub.cancel()
  delete streams[id]
}

const methods = {
  async destroyStreams() {
    console.log('destroyStreams')
    closeDb()
    relay.close()
    self.close()
    return true
  },

  // delete everything
  dbErase() {
    // return await db.destroy()
    // await initDb()
    closeDb()

    // let filepath = `/nostr/${dbName}`

    let exists = true
    try {
      SQL.FS.stat(path)
    } catch (e) {
      exists = false
    }

    if (exists) {
      SQL.FS.unlink(path)
    }
    return
  },

  dbSave(event) {
    let events = [{ event }]
    saveEventsToDb(events)
    return event
  },

  dbStreamFeed(since, callback) {
    let result = queryDb(`
      SELECT event
      FROM nostr
      WHERE json_extract(event,'$.kind') IN (1, 2)
        AND json_extract(event,'$.created_at') >= ${since}
    `)
    if (result.length) result.forEach(row => callback(JSON.parse(row.event)))
    // callback(result.map(row => row.event))
    // let sub = relay.subFeed(since)
    return {
      filter: {
        kinds: [1, 2],
        since
      },
      callback,
      subName: 'subFeed',
      subArgs: [since]
      // sub: relay.subFeed(since)
    }
    // return result
  },

  dbChats(pubkey) {
    let result = queryDb(`
      SELECT peer, MAX(last_message) last_message
      FROM (
        SELECT pubkey AS peer,
          MAX(created_at) last_message
        FROM idx_kind_tag_created_at
        WHERE kind = 4
          AND trim(substr(tag, 2, instr(tag, ',') - 2), '"') = 'p'
          AND trim(rtrim(substr(tag, instr(tag, ',') + 1), ']'), '"') = '${pubkey}'
        GROUP BY tag, pubkey

        UNION ALL

        SELECT trim(rtrim(substr(tag, instr(tag, ',') + 1), ']'), '"') AS peer,
          MAX(created_at) last_message
        FROM idx_kind_tag_created_at
        WHERE kind = 4
          AND trim(substr(tag, 2, instr(tag, ',') - 2), '"') = 'p'
          AND pubkey = '${pubkey}'
        GROUP BY tag, pubkey
      )
      GROUP BY peer
    `)
    // let result = queryDb(`
    //   SELECT tag, pubkey, MAX(created_at) last_message
    //   FROM idx_kind_tag_created_at
    //   WHERE kind = 4
    //   GROUP BY tag, pubkey
    // `)

    return result
      .sort((a, b) => b.last_message - a.last_message)
      .map(row => {
        return {
          peer: row.peer,
          lastMessage: row.last_message
        }
      })
    // return result.map(row => {
    //   return {
    //     peer: row.pubkey === pubkey ? row.tag[1] : row.pubkey,
    //     lastMessage: row.last_message
    //   }
    // }).sort((a, b) => b.lastMessage - a.lastMessage)
  },

  dbMessages(userPubkey, peerPubkey, limit, until) {
    let result = queryDb(`
      SELECT n.event
      FROM idx_kind_tag_created_at idx
      LEFT JOIN nostr n ON idx.id = n.id
      WHERE idx.kind = 4 AND
        ((idx.tag = '["p","${userPubkey}"]' AND idx.pubkey = '${peerPubkey}') OR
        (idx.tag = '["p","${peerPubkey}"]' AND idx.pubkey = '${userPubkey}')) AND
        idx.created_at <= ${until}
      ORDER BY idx.created_at
      LIMIT ${limit}
    `)
    let messages = result
      .map(row => JSON.parse(row.event))
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
    return messages
  },

  // streamUserMessages(pubkey, callback) {
  //   // let sub = relay.subUserMessages(pubkey)
  //   return {
  //     filter: {
  //       kinds: [4],
  //       authors: [pubkey]
  //     },
  //     callback,
  //     sub: relay.subUserMessages(pubkey)
  //   }
  // },

  streamMessages(callback) {
    // let sub = relay.subUserMessages(pubkey)
    return {
      filter: {
        kinds: [4]
      },
      callback,
      // sub
    }
  },

  // dbEvent(id) {
  //   let result = queryDb(`
  //     SELECT event
  //     FROM nostr
  //     WHERE id = '${id}'
  //   `)
  //   return result.map(row => JSON.parse(row.event))
  // },

  dbStreamEvent(id, updates, callback) {
    let ids = Array.isArray(id) ? id : [id]
    let idList = `(
      ${ids.map(id => `'${id}'`).join(',')}
    )`
    let result = queryDb(`
      SELECT event
      FROM nostr
      WHERE id IN ${idList}
    `)
    if (result.length) result.forEach(row => callback(JSON.parse(row.event)))
    if (result.length === 1 && ids.length === 1 && !updates) return {
      filter: {
        ids
      },
      callback,
    }
    // let sub = relay.subEvent(id)
    return {
      filter: {
        ids
      },
      callback,
      subName: 'subEvent',
      subArgs: [ids]
      // sub: relay.subEvent(ids)
    }
  },

  dbMentions(pubkey, limit, until) {
    let result = queryDb(`
      SELECT n.event
      FROM idx_kind_tag_created_at idx
      LEFT JOIN nostr n ON idx.id = n.id
      WHERE idx.kind = 1 AND
        idx.tag = '["p","${pubkey}"]' AND
        idx.created_at <= ${until}
      ORDER BY idx.created_at DESC
      LIMIT ${limit}
    `)
    return result.map(row => JSON.parse(row.event))
  },

  streamMentions(pubkey, callback) {
    // don't need to open relay sub bc launch already subs the mentions
    // also don't need date restriction as db should always be up to date
    // and only new messages will be inserted
    return {
      filter: {
        kinds: [1],
        '#p': [pubkey]
      },
      callback
    }
  },

  dbUnreadMentionsCount(pubkey, since) {
    let result = queryDb(`
      SELECT COUNT(*) count
      FROM idx_kind_tag_created_at
      WHERE kind = 1 AND
        tag = '["p","${pubkey}"]' AND
        created_at >= ${since}
    `)
    // return result.length ? result[0].count : 0
      // return result[0].count
    return result[0].count
    // return result.count
  },

  dbUnreadMessagesCount(userPubkey, peerPubkey, since) {
    let result = queryDb(`
      SELECT COUNT(*) count
      FROM nostr
      WHERE json_extract(event,'$.kind') = 4 AND
        json_extract(event,'$.pubkey') = '${peerPubkey}' AND
        json_extract(event,'$.created_at') >= ${since} AND
        instr(json_extract(event,'$.tags'),'["p","${userPubkey}"')
    `)
    // return result.length ? result[0].count : 0
    return result[0].count
  },

  dbUserProfile(pubkey) {
    // let intervals = 0
    // let event = null
    // while (event === null && intervals < 20) {
    //   await new Promise((resolve) => setTimeout(resolve, 100))
      let result = queryDb(`
        SELECT event
        FROM nostr
        WHERE json_extract(event,'$.kind') = 0 AND
          json_extract(event,'$.pubkey') = '${pubkey}'
        LIMIT 1
      `)
    //   if (result.length === 0) intervals++
    //   else event = result[0].event
    // }
    return result.length ? JSON.parse(result[0].event) : null
    // return event
  },

  dbUserFollows(pubkey) {
      let result = queryDb(`
        SELECT event
        FROM nostr
        WHERE json_extract(event,'$.kind') = 3 AND
          json_extract(event,'$.pubkey') = '${pubkey}'
        LIMIT 1
      `)
      // if (result.length === 0) return [1]
      // // if (result.length === 0) intervals++
      // else event = result[0].event
    // }
    // return result.map(row => row.event)
    // return event
    return result.length ? JSON.parse(result[0].event) : null
  },

  dbUserNotes(pubkey, until, limit) {
    // let intervals = 0
    // let event = null
    // while (event === null && intervals < 20) {
    //   await new Promise((resolve) => setTimeout(resolve, 100))
      let result = queryDb(`
        SELECT event
        FROM nostr
        WHERE json_extract(event,'$.kind') = 1 AND
          json_extract(event,'$.pubkey') = '${pubkey}' AND
          json_extract(event,'$.created_at') <= ${until}
        LIMIT ${limit}
      `)
    //   if (result.length === 0) intervals++
    //   else event = result[0].event
    // }
  // console.log('streamUserNotes', result)
  return result.map(row => JSON.parse(row.event))
    // return event
  },

  streamUser(pubkey, callback) {
    // let pubkeys = Array.isArray(pubkey) ? pubkey : [pubkey]
    return {
      filter: {
        kinds: [0, 1, 2, 3, 4],
        authors: [pubkey]
      },
      callback,
      subName: 'subUser',
      subArgs: [pubkey]
      // sub: relay.subUser(pubkey)
    }
  },

  streamUserNotes(pubkey, callback) {
    // let pubkeys = Array.isArray(pubkey) ? pubkey : [pubkey]
    return {
      filter: {
        kinds: [1],
        authors: [pubkey]
      },
      callback,
      subName: 'subUserNotes',
      subArgs: [pubkey]
      // sub: relay.subUserNotes(pubkey)
    }
  },

  dbStreamUserProfile(pubkey, callback) {
    let pubkeys = Array.isArray(pubkey) ? pubkey : [pubkey]
    let pubkeyList = `(
      ${pubkeys.map(pubkey => `'["p","${pubkey}"]'`).join(',')}
    )`
    let result = queryDb(`
      SELECT event
      FROM nostr
      WHERE json_extract(event,'$.kind') = 0 AND
        json_extract(event,'$.pubkey') IN ${pubkeyList}
    `)
    if (result.length) result.forEach(row => callback(JSON.parse(row.event)))
    return {
      filter: {
        kinds: [0],
        authors: pubkeys
      },
      callback,
      subName: 'subUserProfile',
      subArgs: [pubkeys]
      // sub: relay.subUserProfile(pubkeys)
    }
  },

  streamUserProfile(pubkey, callback) {
    let pubkeys = Array.isArray(pubkey) ? pubkey : [pubkey]
    return {
      filter: {
        kinds: [0],
        authors: pubkeys
      },
      callback,
      subName: 'subUserProfile',
      subArgs: [pubkeys]
      // sub: relay.subUserProfile(pubkeys)
    }
  },

  streamUserFollows(pubkey, callback) {
    let pubkeys = Array.isArray(pubkey) ? pubkey : [pubkey]
    return {
      filter: {
        kinds: [3],
        authors: pubkeys
      },
      callback,
      subName: 'subUserFollows',
      subArgs: [pubkeys]
      // sub: relay.subUserFollows(pubkeys)
    }
  },

  dbStreamUserFollows(pubkey, callback) {
    let pubkeys = Array.isArray(pubkey) ? pubkey : [pubkey]
    let result = queryDb(`
      SELECT event
      FROM nostr
      WHERE json_extract(event,'$.kind') = 3 AND
        json_extract(event,'$.pubkey') IN (${JSON.stringify(...pubkeys)})
    `)
    if (result.length) result.forEach(row => callback(JSON.parse(row.event)))
    return {
      filter: {
        kinds: [3],
        authors: pubkeys
      },
      callback,
      subName: 'subUserFollows',
      subArgs: [pubkeys]
      // sub: relay.subUserFollows(pubkeys)
    }
  },

  dbStreamUserFollowers(pubkey, callback) {
    let pubkeys = Array.isArray(pubkey) ? pubkey : [pubkey]
    let pubkeyList = `(
      ${pubkeys.map(pubkey => `'["p","${pubkey}"]'`).join(',')}
    )`
    let result = queryDb(`
      SELECT n.event
      FROM idx_kind_tag_created_at idx
      LEFT JOIN nostr n ON idx.id = n.id
      WHERE json_extract(event,'$.kind') = 3 AND
        idx.tag IN ${pubkeyList}
    `)
    if (result.length) result.forEach(row => callback(JSON.parse(row.event)))
    return {
      filter: {
        kinds: [3],
        '#p': pubkeys
      },
      callback,
      subName: 'subUserFollowers',
      subArgs: [pubkeys]
      // sub: relay.subUserFollowers(pubkeys)
    }
  },

  dbStreamTagKind(type, value, kind, callback) {
    let values = Array.isArray(value) ? value : [value]
    let kinds = Array.isArray(kind) ? kind : [kind]
    let tagList = `(
      ${values.map(value => `'["${type}","${value}"]'`).join(',')}
    )`
    let result = queryDb(`
      SELECT n.event
      FROM idx_kind_tag_created_at idx
      LEFT JOIN nostr n ON idx.id = n.id
      WHERE idx.kind IN (${JSON.stringify(...kinds)}) AND
        idx.tag IN ${tagList}
    `)
    if (result.length) result.forEach(row => callback(JSON.parse(row.event)))
    // return result.map(row => JSON.parse(row.event))
    return {
      filter: {
        [type]: values,
        kinds
      },
      callback,
      subName: 'subTag',
      subArgs: [type, values]
      // sub: relay.subTag(type, values)
    }
  },

  streamTag(type, value, callback) {
    let values = Array.isArray(value) ? value : [value]
    // let sub = relay.subUserMessages(pubkey)
    // await new Promise((resolve) => setTimeout(resolve, 5000))

    // let sub = relay.subTag(type, values)
    return {
      filter: {
        [type]: values
      },
      callback,
      subName: 'subTag',
      subArgs: [type, values]
      // sub: relay.subTag(type, values)
    }
  },

  prune(user, pubkeys) {
    let until = Math.round(Date.now() / 1000) - (10 * 24 * 60 * 60)
    let pubkeyList = `("${pubkeys.join('","')}")`
    let result = queryDb(`
      DELETE
      FROM nostr
      WHERE json_extract(event,'$.kind') IN (1,2) AND
        json_extract(event,'$.created_at') <= ${until} AND
        json_extract(event,'$.last_updated') <= ${until} AND
        json_extract(event,'$.pubkey') NOT IN ${pubkeyList} AND
        NOT instr(json_extract(event,'$.tags'), '${user}')
        `)
    return result
  },


  dbQuery(sql) {
    return queryDb(sql)
  },

  setRelays(relays) {
    relay.setRelays(relays)
  },

  publish(event, relayURL) {
    return relay.publish(event, relayURL)
  },
}

var streams = {}
async function run() {
  // db is not initialized, collect all requests in a queue
  var queue = []
  self.onmessage = function (ev) {
    queue.push(ev)
  }
  if (db === null) await initDb()

  // var subs = {}

  // self.onmessage = async function (ev) {
  async function handleMessage(ev) {
    // console.log('onmessage', ev, db)

    // let { name, args, id, stream, cancel } = JSON.parse(ev.data)
    // let { name, args, id, stream, cancel, sub } = JSON.parse(ev.data)
    // let { name, args, id, stream, cancel } = JSON.parse(ev.data)
    // console.log('ev', ev)
    let { name, args, id, stream, cancel } = typeof ev.data === 'string' ? JSON.parse(ev.data) : ev.data
    // console.log('name, args, id, stream, cancel', name, args, id, stream, cancel)
    // if (ev.ports.length && name === 'setPort') {
    //   relayWorkerPort = ev.ports[0]
    //   // relayWorker.addEventListener('message', e => {
    //   // relayWorker.onmessage = ev => {
    //   relayWorkerPort.onmessage = ev => {
    //     switch (ev.data.type) {
    //       case 'events': {
    //         console.log(ev.data)
    //         // debouncedDbSave([ev.data])
    //         saveEventsToDb(ev.data.events)
    //         // lastSave = Date.now();
    //         break
    //       }
    //       default: {
    //         output(ev.data)
    //         break
    //       }
    //     }
    //   }
    //   return
    // }

    if (cancel) {
      // subs[id].cancel()
      // delete subs[id]
      // if (subs[id]) cancelSub(id)
      // else if (streams[id]) cancelStream(id)
      cancelStream(id)
    // } else if (sub) {
    //   subs[id] = methods[name](...args)
    //   setRelayFilter()
    } else if (stream) {
      // if (stream) {
      let changes = methods[name](...args, event => {
        self.postMessage({
            id,
            data: event,
            stream: true
        })
      })
      if (streams[id] && streams[id].sub) {
        changes.sub = streams[id].sub
        changes.sub.update(...changes.subArgs)
      } else if (changes.subName && changes.subArgs) {
        changes.sub = relay[changes.subName](...changes.subArgs)
      }
      streams[id] = changes
      // } else if (cancel) {
      //   // streams[id].cancel()
      //   if (streams[id].sub) streams[id].sub.cancel()
      //   delete streams[id]
    } else {
      var reply = { id }
        try {
          let data = methods[name](...args)
          reply.success = true
          reply.data = data
        } catch (err) {
          reply.success = false
          reply.error = err
        }
        // console.log('reply', reply)

        self.postMessage(JSON.stringify(reply))
    }
  }

  // db is initialized now, execute all in the query and run them immediately from here onwards
  self.onmessage = handleMessage
  queue.forEach(ev => handleMessage(ev))
  queue = null
}
run()
