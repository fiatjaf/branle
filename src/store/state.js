import {LocalStorage} from 'quasar'

export default function () {
  return {
    keys: LocalStorage.getItem('keys') || {pub: '00'}, // { mnemonic, priv, pub }
    relays: LocalStorage.getItem('relays') || {}, // { [url]: {} }
    following: LocalStorage.getItem('following') || [], // [ pubkeys... ]

    profilesCache: {}, // { [pubkey]: {name, about, picture, ...} }
    profilesCacheLRU: [], // [ pubkeys... ]

    lastNotificationRead: LocalStorage.getItem('lastNotificationRead') || 0
  }
}
