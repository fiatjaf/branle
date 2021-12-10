import {createStore} from 'vuex'

import state from './state'
import * as getters from './getters'
import * as mutations from './mutations'
import * as actions from './actions'
import storage from './storage'

export default createStore({
  state,
  getters,
  mutations,
  actions,
  plugins: [storage]
})
