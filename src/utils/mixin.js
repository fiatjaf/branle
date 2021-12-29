import relative from 'relative-date'
import {date} from 'quasar'

export default {
  methods: {
    json(o) {
      return JSON.stringify(o, null, 2)
    },

    log(o) {
      return console.log(o)
    },

    toProfile(pubkey) {
      this.$router.push('/' + pubkey)
    },

    toEvent(id) {
      this.$router.push('/event/' + id)
    },

    shorten(str) {
      return str.slice(0, 3) + '…' + str.slice(-4)
    },

    niceDate(value) {
      if (value + 60 * 60 /* an hour */ > Date.now() / 1000) {
        return relative(value * 1000)
      }

      return date.formatDate(value * 1000, 'YYYY MMM D h:mm A')
    }
  }
}
