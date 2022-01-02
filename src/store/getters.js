import Identicon from 'identicon.js'

export function hasName(state) {
  return pubkey => !!state.profilesCache[pubkey]
}

export function displayName(state) {
  return pubkey => {
    let pubShort = pubkey.slice(0, 3) + '...' + pubkey.slice(-4)
    let {name = pubShort} = state.profilesCache[pubkey] || {}
    return name
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
