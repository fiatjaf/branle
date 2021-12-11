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
        LocalStorage.set('relays', state.relays)
        break
      case 'follow':
      case 'unfollow':
        LocalStorage.set('following', state.following)
        break
      case 'addEvent':
        LocalStorage.set(
          `events.${payload.kind}`,
          state.events[`kind${payload.kind}`]
        )
        break
    }
  })
}
