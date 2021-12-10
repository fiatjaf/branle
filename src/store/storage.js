import {LocalStorage} from 'quasar'

export default function (store) {
  store.subscribe(({type, payload}, state) => {
    switch (type) {
      case 'setProfile':
      case 'relayPush':
      case 'relaySplice':
        console.log('storing', state.myProfile)
        LocalStorage.set('myProfile', state.myProfile)
        break
      case 'startFollowing':
      case 'stopFollowing':
      case 'addKind0':
        LocalStorage.set('theirProfile', state.theirProfile)
        break
      case 'addKind1':
      case 'replaceKind1':
      case 'deleteKind1':
        LocalStorage.set('kind1', state.kind1)
        break
    }
  })
}
