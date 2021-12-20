import {LocalStorage} from 'quasar'

export default function (store) {
  store.subscribe(({type, payload}, state) => {
    switch (type) {
      case 'setKeys':
        LocalStorage.set('keys', state.keys)
        break
      case 'setProfile':
        LocalStorage.set('me', state.me)
        break
      case 'addRelay':
      case 'removeRelay':
      case 'setRelayOpt':
        LocalStorage.set('relays', state.relays)
        break
      case 'follow':
      case 'unfollow':
        LocalStorage.set('following', state.following)
        break
      case 'haveReadNotifications':
        LocalStorage.set('lastNotificationRead', state.lastNotificationRead)
        break
    }
  })
}
