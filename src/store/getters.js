import Identicon from 'identicon.js'

export function namedProfiles(state, getters) {
  return Object.entries(state.profilesCache)
    .reduce((result, [pubkey, profile]) => getters.hasName(pubkey)
      ? [...result, { ...profile, pubkey }] // [..., { name, pubkey, nip05, ...}, ...]
      : result,
      []
    )
}

export function hasName(state) {
  return pubkey => {
    let {name, nip05} = state.profilesCache[pubkey] || {}
    return (name || nip05 || '').length > 0
  }
}

export function displayName(state, getters) {
  return pubkey => {
    let {name, nip05} = state.profilesCache[pubkey] || {}
    return getters.hasName(pubkey)
      ? nip05 || name
      : pubkey.slice(0, 3) + '...' + pubkey.slice(-4)
  }
}

export function isVerifiedNIP05(state) {
  return pubkey => {
    let {nip05} = state.profilesCache[pubkey] || {}
    return nip05
  }
}

export function avatar(state) {
  return pubkey => {
    let {
      picture = 'data:image/png;base64,' + new Identicon(pubkey, 40).toString()
    } = state.profilesCache[pubkey] || {}
    return picture
  }
}

export function profileDescription(state) {
  return pubkey => {
    let {about = ''} = state.profilesCache[pubkey] || {}
    return about
  }
}

export function contacts(state) {
  return (pubkey, short = true) =>
    state.contactListCache[pubkey]?.slice(0, short ? 6 : Math.inf)
}

export function hasMoreContacts(state) {
  return pubkey => state.contactListCache[pubkey]?.length > 6
}

export function unreadChats(state) {
  delete state.unreadMessages[state.keys.pub]
  return Object.values(state.unreadMessages).filter(v => v).length
}

export function canSignEventsAutomatically(state) {
  return Boolean(state.keys.priv || window.nostr)
}

export function canEncryptDecrypt(state) {
  return Boolean(state.keys.priv || (window.nostr && window.nostr.nip04))
}
