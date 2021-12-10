import {getEventHash} from 'nostr-tools'
import {encrypt, decrypt} from 'nostr-tools/nip04'
import {LocalStorage, Notify} from 'quasar'
import 'md-gum-polyfill'

import {pool} from '../global'

export function launch(store) {
  pool.setPrivateKey(store.state.myProfile.privkey)

  store.state.myProfile.relays.forEach(relay => {
    pool.addRelay(relay)
  })

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
        authors: Object.keys(store.state.theirProfile).length
          ? Object.keys(store.state.theirProfile)
          : null
      },
      {
        author: store.state.myProfile.pubkey
      },
      {
        '#p': store.state.myProfile.pubkey
      }
    ],
    cb: (event, relay) => {
      switch (event.kind) {
        case 0:
          store.commit('addKind0', event)
          break

        case 1:
          for (let i = 0; i < store.state.kind1.length; i++) {
            if (
              (store.state.kind1[i].loading === true ||
                store.state.kind1[i].retry === true) &&
              store.state.kind1[i].id === event.id
            ) {
              event.retry = false
              event.loading = false
              store.commit('replaceKind1', {index: i, event})
              return
            } else if (store.state.kind1[i].id === event.id) {
              return
            }
          }

          store.commit('addKind1', event)
          break

        case 4:
          // a direct encrypted message
          if (
            event.tags.find(
              tag => tag[0] === 'p' && tag[1] === store.state.myProfile.pubkey
            )
          ) {
            // it is addressed to us
            let lsKey = `messages.${event.pubkey}`
            var messages = LocalStorage.getItem(lsKey) || []

            if (messages.find(({id}) => id === event.id)) {
              // we already have this one, discard
              return
            }

            // decrypt it
            let [ciphertext, iv] = event.content.split('?iv=')
            let text = decrypt(
              store.state.myProfile.privkey,
              event.pubkey,
              ciphertext,
              iv
            )

            // store it locally push
            messages.push({
              text,
              from: event.pubkey,
              id: event.id,
              created_at: event.created_at,
              tags: event.tags,
              loading: false,
              retry: false
            })

            LocalStorage.set(lsKey, messages)

            // a hack to update the UI
            store.commit('chatUpdated')
          } else if (
            event.pubkey === store.state.myProfile.pubkey &&
            event.tags[0][1] in store.state.theirProfile
          ) {
            // it is coming from us
            let p = event.tags.find(tag => tag[0] === 'p')
            let lsKey = `messages.${p[1]}`
            var messagesS = LocalStorage.getItem(lsKey)

            if (messagesS.length > 0) {
              for (var i = 0; i < messagesS.length; i++) {
                if (
                  messagesS[i].id === event.id &&
                  messagesS[i].loading === true
                ) {
                  messagesS[i].loading = false
                  LocalStorage.set(lsKey, messagesS)
                  return
                }
              }

              if (messagesS.find(({id}) => id === event.id)) {
                // we already have this one, discard
                return
              }

              // decrypt it
              let [ciphertext, iv] = event.content.split('?iv=')
              let text = decrypt(
                store.state.myProfile.privkey,
                p[1],
                ciphertext,
                iv
              )
              messagesS.push({
                text,
                from: event.pubkey,
                id: event.id,
                created_at: event.created_at,
                tags: event.tags,
                loading: false,
                retry: false
              })
              LocalStorage.set(lsKey, messagesS)
            }
          }

          break
      }
    }
  })
}

export function relayPush(store, url) {
  store.commit('relayPush', url)
  pool.addRelay(url, {
    read: true,
    write: true
  })
}

export async function relayRemove(store, url) {
  store.commit('relaySplice', url)
  pool.removeRelay(url)
}

export async function sendPost(store, {message, tags = [], kind = 1}) {
  if (message.length === 0) return

  let event = {
    pubkey: store.state.myProfile.pubkey,
    created_at: Math.floor(Date.now() / 1000),
    kind,
    tags,
    content: message
  }

  event.id = await getEventHash(event)
  pool.publish(event)

  store.commit('addKind1', {
    ...event,
    loading: true,
    retry: false
  })
}

export function postAgain(store, event) {
  for (let i = 0; i < store.state.kind1.length; i++) {
    if (store.state.kind1[i].id === event.id) {
      store.commit('replaceKind1', {
        index: i,
        event: {
          ...event,
          loading: true,
          retry: false
        }
      })
    }
  }
  pool.publish(event)
}

export async function saveMeta(store, {image, handle, about}) {
  store.commit('setProfile', {
    ...store.state.myProfile,
    picture: image,
    name: handle,
    about
  })

  var event = {
    pubkey: store.state.myProfile.pubkey,
    created_at: Math.floor(Date.now() / 1000),
    kind: 0,
    tags: [],
    content: JSON.stringify({
      name: store.state.myProfile.name,
      about: store.state.myProfile.about,
      picture: store.state.myProfile.picture
    })
  }

  event.id = await getEventHash(event)
  pool.publish(event)
}

export function deletePost(store, postId) {
  store.commit('deleteKind1', postId)
}

export function startFollowing(store, key) {
  if (key in store.state.theirProfile) {
    Notify.create({
      message: 'Already following',
      color: 'pink'
    })
    return
  }

  if (!key.match(/^[0-9a-fA-F]{64}$/)) {
    Notify.create({
      message:
        'Invalid public key. Must be 32 bytes hex-encoded (64 characters).',
      color: 'pink'
    })
    return
  }

  LocalStorage.set(`messages.${key}`, [])
  store.commit('startFollowing', key)
  store.dispatch('restartHomeFeed')
}

export async function stopFollowing(store, key) {
  if (!(key in store.state.theirProfile)) {
    Notify.create({
      message: 'No such user',
      color: 'pink'
    })
    return
  }

  store.commit('stopFollowing', key)
  store.dispatch('restartHomeFeed')
}

export function finalGenerate(store, {keystoreoption, publickey, privatekey}) {
  var profile = {
    pubkey: publickey,
    privkey: privatekey,
    relays: [
      'wss://nostr-relay.herokuapp.com/ws',
      'wss://nostr-relay.bigsun.xyz/ws',
      'wss://freedom-relay.herokuapp.com/ws'
      // 'wss://relay.nostr.org',
      // 'wss://nodestr-relay.dolu.dev/ws'
    ],
    avatar: null,
    handle: null,
    about: null
  }

  if (keystoreoption === 'external') {
    profile.privkey = null
  }

  store.commit('setProfile', profile)
  LocalStorage.set('theirProfile', {})
  LocalStorage.set('kind1', [])

  store.dispatch('launch')
}

export async function sendChatMessage(store, {pubkey, text}) {
  if (text.length === 0) return

  let [ciphertext, iv] = encrypt(store.state.myProfile.privkey, pubkey, text)

  // make event
  let event = {
    pubkey: store.state.myProfile.pubkey,
    created_at: Math.floor(Date.now() / 1000),
    kind: 4,
    tags: [['p', pubkey]],
    content: ciphertext + '?iv=' + iv
  }

  let lsKey = `messages.${pubkey}`
  var messages = LocalStorage.getItem(lsKey) || []

  if (messages.length > 0) {
    event.tags.push(['e', messages[messages.length - 1].id])
  }
  event.id = await getEventHash(event)

  let message = {
    text,
    from: store.state.myProfile.pubkey,
    id: event.id,
    created_at: event.created_at,
    tags: event.tags,
    loading: true,
    failed: false
  }

  messages.push(message)
  LocalStorage.set(lsKey, messages)
  pool.publish(event)
}

export function deleteChatMessage(store, {pubkey, id}) {
  let lsKey = `messages.${pubkey}`
  var messages = LocalStorage.getItem(lsKey) || []

  let index = messages.findIndex(message => message.id === id)
  if (index === -1) return

  messages.splice(index, 1)
  LocalStorage.set(lsKey, messages)
}
