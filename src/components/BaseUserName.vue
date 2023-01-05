<template>
  <div
    class='cursor-pointer flex'
    :class="(alignRight ? ' justify-end' : ' justify-start') +
      (headerMode ? ' column items-start' : ' row items-center') +
      (wrap ? '' : ' no-wrap')"
    @click.stop="toProfile(pubkey)"
    style='gap: .1rem'
    :style="alignRight ? 'text-align: right;' : 'text-align: left'"
  >
    <div
      v-if="$store.getters.name(pubkey)"
      class='text-bold flex row no-wrap items-center'
      style='gap: .2rem;'
      clickable
    >
      {{ $store.getters.name(pubkey) }}
      <q-icon v-if='showFollowing && isFollow' name='visibility' :size="headerMode ? 'sm' : 'xs'" color='secondary'>
        <q-tooltip>
          following
        </q-tooltip>
      </q-icon>
    </div>
    <div class='flex row no-wrap items-center' :style='headerMode ? "gap: .3rem;" : "gap: .1rem;"'>
      <BaseButtonNIP05 :pubkey='pubkey' :button-size="headerMode ? 'sm' : 'xs'"/>
      <div v-if='$store.getters.NIP05Id(pubkey)' style='opacity: .9; font-size: 90%; font-weight: 300; line-height: 90%'>
        {{ headerMode ? niceNIP05 : niceShortNIP05 }}
      </div>
    </div>
    <div v-if='headerMode && lnurlToLnAddr($store.getters.profileLud06(pubkey))'  style='opacity: .9; font-size: 90%; font-weight: 300; line-height: 90%'
    >
      ⚡️{{ lnurlToLnAddr($store.getters.profileLud06(pubkey)) }}
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
    showFollowing: {type: Boolean, default: false},
    // showVerified: {type: Boolean, default: false},
  },
  computed: {
    niceShortNIP05() {
      return this.$store.getters.NIP05Id(this.pubkey)
        .split('@')
        .map((el, index) => (index === 0 && (el === '_' || el === this.$store.getters.name(this.pubkey))) ? '' : el).join('@')
    },
    niceNIP05() {
      return this.$store.getters.NIP05Id(this.pubkey)
        .split('@')
        .map((el, index) => (index === 0 && (el === '_')) ? '' : el).join('@')
    },
    isFollow() {
      return this.$store.state.follows.includes(this.pubkey)
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
