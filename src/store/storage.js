import {LocalStorage} from 'quasar'

export default function (store) {
  store.subscribe(({type, payload}, state) => {
    switch (type) {
      case 'setProfile':
        LocalStorage.set('me', state.me)
      case 'addRelay':
      case 'removeRelay':
        LocalStorage.set('relays', state.relays)
        break
      case 'follow':
      case 'unfollow':
        LocalStorage.set('following', state.following)
      case 'addEvent':
        LocalStorage.set(
          `events.${payload.kind}`,
          state.events[`kind${payload.kind}`]
        )
        break
    }
  })
}
