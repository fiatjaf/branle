import {LocalStorage} from 'quasar'
import {getPublicKey} from 'nostr-tools'
import bip32 from 'bip32'
import * as bip39 from 'bip39'

export function setKey(state, {seed, priv, pub} = {}) {
  if (!seed && !priv && !pub) {
    // generate
    let randomBytes = crypto.randomBytes(16)
    let mnemonic = bip39.entropyToMnemonic(randomBytes.toString('hex'))
    seed = bip39.mnemonicToSeedSync(mnemonic)
  }

  if (seed) {
    let root = bip32.fromSeed(seed)
    priv = root.privateKey.toString('hex')
  }

  if (priv) {
    pub = getPublicKey(priv)
  }

  state.keys = {seed, priv, pub}
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
      let peer = event.pubkey === state.key.pub ? peerTag[1] : event.pubkey
      if (state.events.kind4[peer].find(e => e.id === event.id)) return
      state.events.kind4[peer].push(event)
      break
  }
}

export function chatUpdated(state) {
  state.chatUpdated++
}
