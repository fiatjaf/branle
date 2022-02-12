import {LocalStorage} from 'quasar'

const isClientUsingTor = () => window.location.hostname.endsWith('.onion')

const getMainnetRelays = () => {
  const relays = {
    'wss://rsslay.fiatjaf.com': {read: true, write: false},
    'wss://nostr-pub.wellorder.net': {read: true, write: true},
    'wss://expensive-relay.fiatjaf.com': {read: true, write: false}
  }
  const optional = [
    ['wss://nostr.rocks', {read: true, write: true}],
    ['wss://relayer.fiatjaf.com', {read: true, write: true}],
    ['wss://nostr.onsats.org', {read: true, write: true}],
    ['wss://nostr-relay.untethr.me	', {read: true, write: true}],
    ['wss://nostr-relay.wlvs.space', {read: true, write: true}],
    ['wss://nostr.bitcoiner.social', {read: true, write: true}],
    ['wss://nostr-relay.freeberty.net', {read: true, write: true}]
  ]

  for (let i = 0; i < 3; i++) {
    let pick = parseInt(Math.random() * optional.length)
    let [url, prefs] = optional[pick]
    relays[url] = prefs
    optional.splice(pick, 1)
  }

  return relays
}

const getTorRelays = () => ({
  'ws://jgqaglhautb4k6e6i2g34jakxiemqp6z4wynlirltuukgkft2xuglmqd.onion': {
    read: true,
    write: true
  }
})

export default function () {
  const relays = isClientUsingTor() ? getTorRelays() : getMainnetRelays()

  return {
    keys: LocalStorage.getItem('keys') || {}, // {priv, pub }

    relays, // { [url]: {} }
    following: [], // [ pubkeys... ]

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
