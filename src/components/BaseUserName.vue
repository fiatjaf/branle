<template>
  <div
    class='cursor-pointer flex'
    :class="(wrap ? 'column items-start' : 'row items-center no-wrap') + (alignRight ? ' justify-end' : ' justify-start')"
    @click.stop="toProfile(pubkey)"
    style='gap: .1rem'
    :style="alignRight ? 'text-align: right;' : 'text-align: left'"
  >
    <!-- style='line-height: 90%' -->
    <div
      v-if="$store.getters.name(pubkey)"
      class='text-bold hover-highlight'
      clickable
    >
    <!-- style='line-height: 80%' -->
      {{ $store.getters.name(pubkey) }}
      <BaseButtonNIP05 :pubkey='pubkey' :button-size="headerMode ? 'sm' : 'xs'"/>
    </div>
    <!-- <br> -->
    <div v-if='$store.getters.NIP05Id(pubkey)' style='opacity: .9; font-size: 90%; font-weight: 300; line-height: 90%'>
      {{ niceNIP05 }}
    </div>
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
    // fallback: {type: Boolean, default: false}, // if the shortened pubkey should be displayed
    wrap: {type: Boolean, default: false},
    alignRight: {type: Boolean, default: false},
    headerMode: {type: Boolean, default: false},
    // showVerified: {type: Boolean, default: false},
  },
  computed: {
    niceNIP05() {
      return this.$store.getters.NIP05Id(this.pubkey)
        .split('@')
        .map(el => (el === '_' || el === this.$store.getters.name(this.pubkey)) ? '' : el).join('@')
    }
  }
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
