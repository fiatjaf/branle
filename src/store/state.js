import {LocalStorage} from 'quasar'

export default function () {
  return {
    me: LocalStorage.getItem('me') || {}, // { name, picture, about, ... }
    keys: LocalStorage.getItem('keys') || {}, // { mnemonic, priv, pub }
    relays: LocalStorage.getItem('relays') || {}, // { [url]: {} }
    following: LocalStorage.getItem('following') || [], // [ pubkeys... ]

    profilesCache: {}, // { [pubkey]: {name, about, picture, ...} }
    profilesCacheLRU: [], // [ pubkeys... ]

    lastNotificationRead: LocalStorage.getItem('lastNotificationRead') || 0
  }
}
