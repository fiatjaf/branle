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

export function addProfileToCache(state, event) {
  if (event.pubkey in state.profilesCache) {
    // was here already, remove from LRU (will readd next)
    state.profilesCacheLRU.splice(
      state.profilesCacheLRU.indexOf(event.pubkey),
      0
    )
  } else {
    try {
      state.profilesCache[event.pubkey] = JSON.parse(event.content)
    } catch (err) {
      return
    }
  }

  // adding to LRU
  state.profilesCacheLRU.push(event.pubkey)

  // removing older stuff if necessary
  if (state.profilesCacheLRU.length > 150) {
    let oldest = state.profilesCacheLRU.shift()
    delete state.profilesCache[oldest]
  }
}
