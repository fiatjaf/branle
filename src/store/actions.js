import {encrypt, decrypt} from 'nostr-tools/nip04'
import {Notify} from 'quasar'

import {pool} from '../pool'
import {dbSave, dbGetProfile} from '../db'

export function launch(store) {
  if (!store.state.keys.pub) {
    store.commit('setKeys') // passing no arguments will cause a new seed to be generated

    // also initialize the lastNotificationRead value
    store.commit('haveReadNotifications')
  }

  // now we already have a key
  if (store.state.keys.priv) {
    pool.setPrivateKey(store.state.keys.priv)
  }

  // add default relays
  if (Object.keys(store.state.relays).length === 0) {
    store.commit('addRelay', 'wss://nostr-pub.wellorder.net')
    store.commit('addRelay', 'wss://relayer.fiatjaf.com')
    // store.commit('addRelay', 'wss://nostr-relay.freeberty.net')
    // store.commit('addRelay', 'wss://freedom-relay.herokuapp.com/ws')
  }

  // setup pool
  for (let url in store.state.relays) {
    pool.addRelay(url)
  }
  pool.onNotice((notice, relay) => {
    Notify.create({
      message: `Relay ${relay.url} says: ${notice}`,
      color: 'pink'
    })
  })

  // start listening for nostr events
  store.dispatch('restartMainSubscription')

  // preload our own profile from the db
  store.dispatch('useProfile', store.state.keys.pub)
}

var mainSub = pool

export function restartMainSubscription(store) {
  mainSub = mainSub.sub(
    {
      filter: [
        // profiles of people we follow
        {
          kind: 0,
          authors: store.state.following.concat(store.state.keys.pub)
        },

        // notes from people we follow and our own
        {
          kind: 1,
          authors: store.state.following.concat(store.state.keys.pub)
        },

        // relay recommendations from people we follow
        {
          kind: 2,
          authors: store.state.following
        },

        // posts mentioning us
        {
          kind: 1,
          '#p': store.state.keys.pub
        },

        // direct messages to us
        {
          kind: 4,
          '#p': store.state.keys.pub
        },

        // our own direct messages to other people
        {
          kind: 4,
          authors: [store.state.keys.pub]
        }
      ],
      cb: (event, relay) => {
        switch (event.kind) {
          case 0:
            break
          case 1:
            break
          case 2:
            break
          case 4:
            // a direct encrypted message
            if (
              event.tags.find(
                ([tag, value]) => tag === 'p' && value === store.state.keys.pub
              )
            ) {
              // it is addressed to us
              // decrypt it
              let [ciphertext, iv] = event.content.split('?iv=')
              event.plaintext = decrypt(
                store.state.keys.priv,
                event.pubkey,
                ciphertext,
                iv
              )
            } else if (event.pubkey === store.state.keys.pub) {
              // it is coming from us
              let [_, target] = event.tags.find(([tag]) => tag === 'p')
              // decrypt it
              let [ciphertext, iv] = event.content.split('?iv=')
              event.plaintext = decrypt(
                store.state.keys.priv,
                target,
                ciphertext,
                iv
              )
            }
            break
        }

        store.dispatch('addEvent', event)
      }
    },
    'main-channel'
  )
}

export async function sendPost(store, {message, tags = [], kind = 1}) {
  if (message.length === 0) return

  let event = pool.publish({
    pubkey: store.state.keys.pub,
    created_at: Math.floor(Date.now() / 1000),
    kind,
    tags,
    content: message
  })

  store.dispatch('addEvent', event)
}

export async function setMetadata(store, metadata) {
  store.commit('setMetadata', metadata)

  let event = pool.publish({
    pubkey: store.state.keys.pub,
    created_at: Math.floor(Date.now() / 1000),
    kind: 0,
    tags: [],
    content: JSON.stringify(metadata)
  })

  store.dispatch('addEvent', event)
}

export async function sendChatMessage(store, {pubkey, text, replyTo}) {
  if (text.length === 0) return

  let [ciphertext, iv] = encrypt(store.state.keys.priv, pubkey, text)

  // make event
  let event = {
    pubkey: store.state.keys.pub,
    created_at: Math.floor(Date.now() / 1000),
    kind: 4,
    tags: [['p', pubkey]],
    content: ciphertext + '?iv=' + iv
  }
  if (replyTo) {
    event.tags.push(['e', replyTo])
  }

  event = pool.publish(event)

  store.dispatch('addEvent', event)
}

export async function addEvent(store, event) {
  await dbSave(event)

  // do things after the event is saved
  switch (event.kind) {
    case 0:
      // this will reset the profile cache for this URL
      store.dispatch('useProfile', event.pubkey)
      break
    case 1:
      break
    case 2:
      break
    case 3:
      break
    case 4:
      break
  }
}

export async function useProfile(store, pubkey) {
  if (pubkey in store.state.profilesCache) {
    // we don't fetch again, but we do commit this so the LRU gets updated
    store.commit('addProfileToCache', store.state.profilesCache[pubkey])
  }

  // fetch from db and add to cache
  const event = await dbGetProfile(pubkey)
  if (event) {
    store.commit('addProfileToCache', event)
  }
}
