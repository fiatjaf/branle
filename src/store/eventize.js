import {debounce} from 'quasar'

export const publishContactList = debounce(store => {
  store.dispatch('publishContactList')
}, 10000)

export default function (store) {
  store.subscribe(({type, payload}, state) => {
    switch (type) {
      // these mutations change the state after user manual inputs
      // different from 'setRelays' and 'setFollowing', which change the state
      // in bulk and are committed only on startup
      case 'addRelay':
      case 'removeRelay':
      case 'setRelayOpt':
      case 'follow':
      case 'unfollow':
        // make an event kind3 and publish it
        publishContactList(store)
        break
    }
  })
}
