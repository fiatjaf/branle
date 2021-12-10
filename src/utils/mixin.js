import {date} from 'quasar'

import {emojis1, emojis2} from './emojis'

export default {
  data() {
    return {
      emojis1,
      emojis2
    }
  },
  methods: {
    toProfile(pubkey) {
      this.$router.push('/user/' + pubkey)
    },

    niceDate(value) {
      return date.formatDate(value, 'YYYY MMM D h:mm A')
    }
  }
}
