<template>
  <div
    class='text-bold hover-highlight'
    :class='headerMode ? " text-h6" : ""'
    :style='!headerMode ? "white-space: nowrap;" : ""'
  >
    <span
      v-if="fallback || $store.getters.hasName(pubkey)"
      clickable
      class='cursor-pointer'
      @click.stop="toProfile(pubkey)"
    >
      {{ $store.getters.displayName(pubkey) }}
    </span>
    <BaseButtonNIP05 v-if='showVerified' :pubkey='pubkey' />
    <!-- <q-icon
      v-if="$store.getters.isVerifiedNIP05(pubkey)"
      name="verified"
      color="accent"
      clickable
      @click="openNIP05"
    /> -->
  </div>
</template>

<script>
import helpersMixin from '../utils/mixin'
import BaseButtonNIP05 from 'components/BaseButtonNIP05.vue'

export default {
  mixins: [helpersMixin],
  components: {
    BaseButtonNIP05,
  },
  props: {
    pubkey: {type: String, required: true},
    fallback: {type: Boolean, default: false}, // if the shortened pubkey should be displayed
    headerMode: {type: Boolean, default: false},
    showVerified: {type: Boolean, default: false},
  },
  // methods: {
  //   openNIP05() {
  //     let [name, domain] = this.$store.getters
  //       .displayName(this.pubkey)
  //       .split('@')
  //     if (!domain) {
  //       domain = name
  //       name = '_'
  //     }
  //     window.open(`https://${domain}/.well-known/nostr.json?name=${name}`)
  //   }
  // }
}
</script>
