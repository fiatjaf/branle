import Identicon from 'identicon.js'

export function disabled(state) {
  return !state.myProfile
}

export function handle(state, pubkey) {
  return pubkey => {
    let profile = state.theirProfile[pubkey]
    if (profile && profile.name) return profile.name

    let kind0 = state.kind0[pubkey]
    if (kind0 && kind0.name) return profile.name

    return pubkey.slice(0, 20) + '...'
  }
}

export function avatar(state) {
  return pubkey => {
    let profile = state.theirProfile[pubkey]
    if (profile && profile.picture) return profile.picture

    let kind0 = state.kind0[pubkey]
    if (kind0 && kind0.picture) return profile.picture

    let data = new Identicon(pubkey, 40).toString()
    return 'data:image/png;base64,' + data
  }
}
