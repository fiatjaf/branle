<template>
  <div>
  {{url}}
  {{preview}}
  </div>
</template>

<script>
import fetch from 'cross-fetch'
// import {publish} from '../query'
// import helpersMixin from '../utils/mixin'

export default {
  name: 'BaseLinkPreview',
  // mixins: [helpersMixin],
  props: {url: {type: String, required: true}},

  data() {
    return {
      preview: '',
    }
  },

  // computed: {
  //   missingFrom() {
  //     // filter out events we don't have locally as they are from people we don't follow
  //     if (!this.event || !this.event.seen_on) return []

  //     return Object.entries(this.$store.state.relays)
  //       .filter(([_, prefs]) => prefs.write)
  //       .map(([url, _]) => url)
  //       .filter(url => this.event.seen_on.indexOf(url) === -1)
  //   },
  // },
  async mounted() {
    let res = await (await fetch(this.url)).json
    console.log('res', res)
    // if (res)
  }
  // methods: {
  //   publishTo(relayURL) {
  //     publish(cleanEvent(this.event), relayURL)
  //   }

  // },
}
</script>

<style lang='css' scoped>
</style>

