<template>
  <div class="inline-flex items-center">
    <span
      v-if="fallback || $store.getters.hasName(pubkey)"
      class="cursor-pointer font-bold text-secondary mr-2"
      @click="toProfile(pubkey)"
    >
      {{ $store.getters.displayName(pubkey) }}
    </span>
    <q-icon
      v-if="$store.getters.isVerifiedNIP05(pubkey)"
      name="verified"
      color="accent"
      class="cursor-pointer mr-1 -ml-1"
      @click="openNIP05"
    />
  </div>
</template>

<script>
import helpersMixin from '../utils/mixin'

export default {
  mixins: [helpersMixin],
  props: {
    pubkey: {type: String, required: true},
    fallback: {type: Boolean, default: false} // if the shortened pubkey should be displayed
  },
  methods: {
    openNIP05() {
      let [name, domain] = this.$store.getters
        .displayName(this.pubkey)
        .split('@')
      if (!domain) {
        domain = name
        name = '_'
      }
      window.open(`https://${domain}/.well-known/nostr.json?name=${name}`)
    }
  }
}
</script>
