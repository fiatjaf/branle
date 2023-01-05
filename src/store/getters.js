import Identicon from 'identicon.js'
import * as helpersMixin from '../utils/mixin'
import { utils } from 'lnurl-pay'

export function namedProfiles(state, getters) {
  return Object.entries(state.profilesCache).reduce(
    (result, [pubkey, profile]) =>
      getters.hasName(pubkey)
        ? [...result, {...profile, pubkey}] // [..., { name, pubkey, nip05, ...}, ...]
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

export function name(state) {
  return pubkey => {
    let {name} = state.profilesCache[pubkey] || {}
    return name
  }
}

export function displayName(state, getters) {
  return pubkey => {
    let {name, nip05} = state.profilesCache[pubkey] || {}

    if (nip05) return nip05.startsWith('_@') ? nip05.slice(2) : nip05
    if (name) return name
    return helpersMixin.default.methods.shorten(helpersMixin.default.methods.hexToBech32(pubkey, 'npub'))
  }
}

export function NIP05Id(state) {
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

export function profileLud06(state) {
  return pubkey => {
    let {lud06, lud16} = state.profilesCache[pubkey] || {}
    if (!lud06 && !lud16) return null
    if (utils.isLnurl(lud06)) return lud06.toLowerCase()
    if (utils.isLightningAddress(lud16)) return helpersMixin.default.methods.lnAddrToLnurl(lud16)
    // if (utils.isLightningAddress(lud06)) return utils.parseLnUrl(utils.decodeUrlOrAddress(lud06))
    return null
  }
}

// export function contacts(state) {
//   return (pubkey, short = true) =>
//     state.contactListCache[pubkey]?.slice(0, short ? 6 : Math.inf)
// }
export function contacts(state) {
  return (pubkey) =>
    state.contactListCache[pubkey]
}

export function hasMoreContacts(state) {
  return pubkey => state.contactListCache[pubkey]?.length > 6
}

export function unreadChats(state) {
  delete state.unreadMessages[state.keys.pub]
  return Object.values(state.unreadMessages).filter(v => v).length
}

export function unreadNotifications(state) {
  return state.unreadNotifications
}

export function canSignEventsAutomatically(state) {
  return Boolean(state.keys.priv || window.nostr)
}

export function canEncryptDecrypt(state) {
  return Boolean(state.keys.priv || (window.nostr && window.nostr.nip04))
}
