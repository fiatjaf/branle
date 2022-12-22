import {LocalStorage} from 'quasar'

const isClientUsingTor = () => window.location.hostname.endsWith('.onion')

const mainnetDefaultRelays = {
    'wss://nostr-pub.wellorder.net': {read: true, write: true},
    'wss://nostr.onsats.org': {read: true, write: true},
    'wss://nostr-relay.wlvs.space': {read: true, write: true},
    'wss://nostr.bitcoiner.social': {read: true, write: true},
    'wss://relay.damus.io': {read: true, write: true},
    'wss://nostr.zebedee.cloud': {read: true, write: false},
    'wss://relay.nostr.info': {read: true, write: false},
    'wss://nostr-pub.semisol.dev': {read: true, write: false},
  }
  // const default = [
  //   ['wss://nostr.rocks', {read: true, write: true}],
  //   ['wss://nostr.onsats.org', {read: true, write: true}],
  //   ['wss://nostr-relay.wlvs.space', {read: true, write: true}],
  //   ['wss://nostr.bitcoiner.social', {read: true, write: true}],
  //   ["wss://relay.damus.io", {read: true, write: true}],
  // ]

  const mainnetOptionalRelays = [
    'wss://nostr-pub.wellorder.net',
    'wss://relay.damus.io',
    'wss://relayer.fiatjaf.com',
    'wss://nostr.rocks',
    'wss://rsslay.fiatjaf.com',
    'wss://nostr.zebedee.cloud',
    'wss://nostr-2.zebedee.cloud',
    'wss://expensive-relay.fiatjaf.com',
    'wss://freedom-relay.herokuapp.com/ws',
    'wss://nostr-relay.freeberty.net',
    'wss://nostr.bitcoiner.social',
    'wss://nostr-relay.wlvs.space',
    'wss://nostr.onsats.org',
    'wss://nostr-relay.untethr.me',
    'wss://nostr.semisol.dev',
    'wss://nostr-pub.semisol.dev',
    'wss://nostr-verified.wellorder.net',
    'wss://nostr.drss.io',
    'wss://nostr.unknown.place',
    'wss://nostr.openchain.fr',
    'wss://nostr.delo.software',
    'wss://relay.nostr.info',
    'wss://relay.minds.com/nostr/v1/ws',
    'wss://nostr.zaprite.io',
    'wss://nostr.oxtr.dev',
    'wss://nostr.ono.re',
    'wss://relay.grunch.dev',
    'wss://relay.cynsar.foundation',
    'wss://nostr.sandwich.farm',
    'wss://relay.nostr.ch',
    'wss://nostr.mom',
    ]

//   for (let i = 0; i < 3; i++) {
//     let pick = parseInt(Math.random() * optional.length)
//     let [url, prefs] = optional[pick]
//     relays[url] = prefs
//     optional.splice(pick, 1)
//   }

//   return relays
// }

const torDefaultRelays = {
  'ws://jgqaglhautb4k6e6i2g34jakxiemqp6z4wynlirltuukgkft2xuglmqd.onion': {
    read: true,
    write: true
  },
  'ws://wagvwfrdrikrqzp7h3b5lwl6btyuttu7mqpeji35ljzq36ovzgjhsfqd.onion': {
    read: true,
    write: true
  }
}

export default function () {
  const defaultRelays = isClientUsingTor() ? torDefaultRelays : mainnetDefaultRelays
  const optionalRelaysList = isClientUsingTor() ? Object.keys(torDefaultRelays) : mainnetOptionalRelays

  return {
    keys: LocalStorage.getItem('keys') || {}, // {priv, pub }

    relays: LocalStorage.getItem('relays') || {}, // { [url]: {} }
    defaultRelays, // { [url]: {} }
    optionalRelaysList, // [ urls... ]
    follows: LocalStorage.getItem('follows') || [], // [ pubkeys... ]

    profilesCache: {}, // { [pubkey]: {name, about, picture, ...} }
    profilesCacheLRU: [], // [ pubkeys... ]
    contactListCache: {}, // { [pubkey]: {name, about, picture, ...} }
    contactListCacheLRU: [], // [ pubkeys... ]
    nip05VerificationCache: {}, // { [identifier]: {pubkey, when }

    lastMessageRead: LocalStorage.getItem('lastMessageRead') || {},
    unreadMessages: {},

    lastNotificationRead: LocalStorage.getItem('lastNotificationRead') || 0,
    unreadNotifications: 0
  }
}
