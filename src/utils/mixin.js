import {date} from 'quasar'

export default {
  methods: {
    toProfile(pubkey) {
      this.$router.push('/' + pubkey)
    },

    toEvent(id) {
      this.$router.push('/event/' + id)
    },

    niceDate(value) {
      return date.formatDate(value * 1000, 'YYYY MMM D h:mm A')
    }
  }
}
