import {getEventHash} from 'nostr-tools'
import {encrypt, decrypt} from 'nostr-tools/nip04'
import {LocalStorage, Notify} from 'quasar'

import {pool} from '../global'

export function launch(store) {
  if (!!store.state.keys.pub) {
    store.commit('setKey') // passing no arguments will cause a new seed to be generated
  }

  // now we already have a key
  if (!!store.state.keys.priv) {
    pool.setPrivateKey(store.state.keys.priv)
  }

  // add default relays
  if (Object.keys(store.state.relays).length === 0) {
    store.commit('addRelay', 'wss://freedom-relay.herokuapp.com/ws')
    store.commit('addRelay', 'wss://relayer.fiatjaf.com')
    store.commit('addRelay', 'wss://nostr-relay.freeberty.net')
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

  store.dispatch('restartHomeFeed')
}

var homeSubscription = pool

export function restartHomeFeed(store) {
  homeSubscription = homeSubscription.sub({
    filter: [
      {
        authors: store.state.following.length ? store.state.following : null
      },
      {
        author: store.state.keys.pub
      },
      {
        '#p': store.state.keys.pub
      }
    ],
    cb: (event, relay) => {
      switch (event.kind) {
        case 0:
          try {
            event.metadata = JSON.parse(event.content)
          } catch (err) {}
          break
        case 1:
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

      store.commit('addEvent', event)
    }
  })
}

export async function sendPost(store, {message, tags = [], kind = 1}) {
  if (message.length === 0) return

  let event = {
    pubkey: store.state.keys.pub,
    created_at: Math.floor(Date.now() / 1000),
    kind,
    tags,
    content: message
  }

  event.id = await getEventHash(event)
  pool.publish(event)

  store.commit('addEvent', event)
}

export async function setMetadata(store, metadata) {
  store.commit('setProfile', metadata)

  var event = {
    pubkey: store.state.keys.pub,
    created_at: Math.floor(Date.now() / 1000),
    kind: 0,
    tags: [],
    content: JSON.stringify(metadata)
  }

  event.id = await getEventHash(event)
  pool.publish(event)
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
  event.id = await getEventHash(event)

  pool.publish(event)
}
