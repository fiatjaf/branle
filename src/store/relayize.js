import {debounce} from 'quasar'

import {pool} from '../pool'

const addRelay = debounce((store, url) => {
  pool.addRelay(url)
}, 3000)

const removeRelay = debounce((store, url) => {
  pool.removeRelay(url)
}, 3000)

const replaceRelay = debounce((store, url, policy) => {
  pool.removeRelay(url)
  pool.addRelay(url, policy)
  store.dispatch('restartMainSubscription')
}, 3000)

export default function (store) {
  store.subscribe(({type, payload}, state) => {
    switch (type) {
      case 'addRelay':
        addRelay(store, payload)
        break
      case 'removeRelay':
        removeRelay(store, payload)
        break
      case 'setRelayOpt':
        replaceRelay(store, payload.url, state.relays[payload.url])
        break

      case 'follow':
      case 'unfollow':
        store.dispatch('restartMainSubscription')
        break
    }
  })
}
