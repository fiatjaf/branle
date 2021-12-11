import {Buffer} from 'buffer'
import {LocalStorage} from 'quasar'
import {getPublicKey} from 'nostr-tools'
import {
  generateSeedWords,
  seedFromWords,
  privateKeyFromSeed
} from 'nostr-tools/nip06'

export function setKeys(state, {mnemonic, priv, pub} = {}) {
  if (!mnemonic && !priv && !pub) {
    mnemonic = generateSeedWords()
  }

  if (mnemonic) {
    let seed = seedFromWords(mnemonic)
    priv = privateKeyFromSeed(seed)
  }

  if (priv) {
    pub = getPublicKey(priv)
  }

  state.keys = {mnemonic, priv, pub}
}

export function setMetadata(state, {name, picture, about}) {
  state.me = {name, picture, about}
}

export function addRelay(state, url) {
  state.relays[url] = {
    read: true,
    write: true
  }
}

export function removeRelay(state, url) {
  delete state.relays[url]
}

export function follow(state, key) {
  if (state.following.includes(key)) {
    return
  }
  state.following.push(key)
}

export function unfollow(state, key) {
  delete state.following[key]
}

export function addEvent(state, event) {
  switch (event.kind) {
    case 0:
      state.events.kind0[event.pubkey] = event
      break
    case 1:
      if (state.events.kind1.find(e => e.id === event.id)) return
      state.events.kind1.push(event)
      break
    case 4:
      let peerTag = event.tags.find(([tag]) => tag === 'p')
      if (!peerTag) return
      let peer = event.pubkey === state.keys.pub ? peerTag[1] : event.pubkey

      if (!state.events.kind4[peer]) {
        state.events.kind4[peer] = []
      }
      if (state.events.kind4[peer].find(e => e.id === event.id)) return

      state.events.kind4[peer].push(event)
      break
  }
}

export function chatUpdated(state) {
  state.chatUpdated++
}
