import {LocalStorage} from 'quasar'

export default function () {
  return {
    me: LocalStorage.getItem('me') || {}, // { name, picture, about, ... }
    keys: LocalStorage.getItem('keys') || {}, // { mnemonic, priv, pub }
    relays: LocalStorage.getItem('relays') || {}, // { [url]: {} }
    following: LocalStorage.getItem('following') || [], // [ pubkeys... ]
    events: {
      kind0: LocalStorage.getItem('events.kind0') || {}, // { [pubkey]: event }
      kind1: LocalStorage.getItem('events.kind1') || [], // [ events... ]
      kind4: LocalStorage.getItem('events.kind4') || {} // { [pubkey]: [events...] }
    },

    chatUpdated: 1 // hack
  }
}
