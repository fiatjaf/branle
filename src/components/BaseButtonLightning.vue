<template>
  <q-btn
    v-if="$store.getters.profileLud06(pubkey) && this.$store.state.config.preferences.lightningTips.enabled"
    icon="bolt"
    class='button-wallet'
    :class='(!verbose ? "q-pr-xs" : "")'
    clickable
    @click.stop='toggleLightningCard'
    :label='verbose ? ("open in wallet") : ""'
    align="left"
    :size='size'
    unelevated
    dense
  >
    <q-tooltip v-if="!verbose">
      tip with bitcoin lightning network
    </q-tooltip>
    <q-dialog v-model="showLightningCard">
      <BaseLightningCard :ln-string='$store.getters.profileLud06(pubkey)' :pubkey='pubkey' style='padding: 1.5rem;'/>
    </q-dialog>
  </q-btn>
</template>

<script>
import { defineComponent } from 'vue'
import helpersMixin from '../utils/mixin'
import BaseLightningCard from 'components/BaseLightningCard.vue'

export default defineComponent({
  name: 'BaseButtonLightning',
  mixins: [helpersMixin],
  components: {
    BaseLightningCard
  },

  data() {
    return {
      showLightningCard: false,
    }
  },

  props: {
    pubkey: {type: String, required: true},
    size: {
      type: String,
      required: false,
      default: 'sm',
    },
    verbose: {
      type: Boolean,
      default: false
    }
  },

  methods: {
    toggleLightningCard() {
      this.showLightningCard = !this.showLightningCard
    },
  }
})
</script>


<style>
.button-wallet {
  opacity: .7;
  transition: all .3s ease-in-out;
}
.button-wallet:hover {
  opacity: 1;
}
</style>
