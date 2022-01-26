import {getPublicKey} from 'nostr-tools'
import {normalizeRelayURL} from 'nostr-tools/relay'
import {
  seedFromWords,
  generateSeedWords,
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

  state.keys = {priv, pub}
}

export function setRelays(state, relays) {
  state.relays = relays
}

export function addRelay(state, url) {
  try {
    normalizeRelayURL(url)
    new URL(url)
  } catch (err) {
    return
  }

  state.relays[url] = {
    read: true,
    write: true
  }
}

export function removeRelay(state, url) {
  delete state.relays[url]
}

export function setRelayOpt(state, {url, opt, value}) {
  if (url in state.relays) {
    state.relays[url][opt] = value
  }
}

export function setFollowing(state, following) {
  state.following = following
}

export function follow(state, key) {
  if (state.keys.pub === key) return
  if (state.following.includes(key)) return
  state.following.push(key)
}

export function unfollow(state, key) {
  let idx = state.following.indexOf(key)
  if (idx >= 0) state.following.splice(idx, 1)
}

export function addProfileToCache(
  state,
  {pubkey, name, about, picture, nip05}
) {
  if (pubkey in state.profilesCache) {
    // was here already, remove from LRU (will readd next)
    state.profilesCacheLRU.splice(state.profilesCacheLRU.indexOf(pubkey), 1)
  }

  // replace the metadata in cache
  state.profilesCache[pubkey] = {name, about, picture, nip05}

  // adding to LRU
  if (pubkey === state.keys.pub) {
    // if it's our own profile, we'll never remove from the cache
  } else {
    state.profilesCacheLRU.push(pubkey)
  }

  // removing older stuff if necessary
  if (state.profilesCacheLRU.length > 150) {
    let oldest = state.profilesCacheLRU.shift()
    delete state.profilesCache[oldest]
  }
}

export function addToNIP05VerificationCache(state, {identifier, pubkey}) {
  state.nip05VerificationCache[identifier] = {
    pubkey,
    when: Math.round(Date.now() / 1000)
  }
}

export function addContactListToCache(state, event) {
  if (event.pubkey in state.contactListCache) {
    // was here already, remove from LRU (will readd next)
    state.contactListCacheLRU.splice(
      state.contactListCacheLRU.indexOf(event.pubkey),
      1
    )
  }

  // replace the event in cache
  try {
    let contacts = event.tags
      .filter(([t, v]) => t === 'p' && v)
      .map(([_, pubkey, relay, petname]) => ({
        pubkey,
        relay,
        petname
      }))
    if (contacts.length) state.contactListCache[event.pubkey] = contacts
  } catch (err) {
    return
  }

  // adding to LRU
  if (event.pubkey === state.keys.pub) {
    // if it's our own contact list, we'll never remove from the cache
  } else {
    state.contactListCacheLRU.push(event.pubkey)
  }

  // removing older stuff if necessary
  if (state.contactListCacheLRU.length > 150) {
    let oldest = state.contactListCacheLRU.shift()
    delete state.contactListCache[oldest]
  }
}

export function haveReadNotifications(state) {
  state.lastNotificationRead = Math.round(Date.now() / 1000)
}

export function setUnreadNotifications(state, count) {
  state.unreadNotifications = count
}

export function haveReadMessage(state, peer) {
  state.lastMessageRead[peer] = Math.round(Date.now() / 1000)
}

export function setUnreadMessages(state, {peer, count}) {
  state.unreadMessages[peer] = count
}
