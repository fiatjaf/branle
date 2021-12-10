import {LocalStorage} from 'quasar'

export default function () {
  return {
    myProfile: LocalStorage.getItem('myProfile'),
    theirProfile: LocalStorage.getItem('theirProfile') || {},

    kind0: {}, // temporary, will be merged with theirProfile or erased at the end
    kind1: LocalStorage.getItem('kind1') || [],

    chatUpdated: 1 // hack
  }
}
