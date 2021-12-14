import Identicon from 'identicon.js'

export function displayName(state) {
  return pubkey => {
    let {name = pubkey.slice(0, 3) + '...' + pubkey.slice(-4)} =
      state.profilesCache[pubkey] || {}
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
