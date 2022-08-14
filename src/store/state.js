import {LocalStorage} from 'quasar'

const isClientUsingTor = () => window.location.hostname.endsWith('.onion')

const getMainnetRelays = () => {
  const relays = [
    ['wss://relay.damus.io', '', ''],
    ['wss://nostr-pub.wellorder.net', '', ''],
    ['wss://nostr-verified.wellorder.net', '', '!'],
    ['wss://expensive-relay.fiatjaf.com', '', '!'],
    ['wss://relay.minds.com/nostr/v1/ws', '', '!']
  ]
  const optional = [
    ['wss://nostr.rocks', '', ''],
    ['wss://nostr.onsats.org', '', ''],
    ['wss://nostr-relay.untethr.me', '', ''],
    ['wss://nostr-relay.wlvs.space', '', ''],
    ['wss://nostr.bitcoiner.social', '', ''],
    ['wss://nostr.openchain.fr', '', ''],
    ['wss://nostr.drss.io', '', '']
  ]

  for (let i = 0; i < 3; i++) {
    let pick = parseInt(Math.random() * optional.length)
    let [url, prefs] = optional[pick]
    relays[url] = prefs
    optional.splice(pick, 1)
  }

  return relays
}

const getTorRelays = () => [
  'ws://jgqaglhautb4k6e6i2g34jakxiemqp6z4wynlirltuukgkft2xuglmqd.onion',
  '',
  ''
]

export default function () {
  const relays = isClientUsingTor() ? getTorRelays() : getMainnetRelays()

  return {
    keys: LocalStorage.getItem('keys') || {}, // {priv, pub }

    relays, // [url, read, write]
    following: [], // [ pubkeys... ]
    homeFeedNotes: [],

    profilesCache: {}, // { [pubkey]: {name, about, picture, ...} }
    profilesCacheLRU: [], // [ pubkeys... ]
    contactListCache: {}, // { [pubkey]: {name, about, picture, ...} }
    contactListCacheLRU: [], // [ pubkeys... ]
    nip05VerificationCache: {}, // { [identifier]: {pubkey, when }

    lastNotificationRead: LocalStorage.getItem('lastNotificationRead') || 0,
    unreadNotifications: 0
  }
}
