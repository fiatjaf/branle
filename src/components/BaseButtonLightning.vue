<template>
  <q-btn-group class='no-padding' flat>
  <q-btn
    v-if="lnString && this.$store.state.config.preferences.lightningTips.enabled"
    icon="bolt"
    class='button-lightning'
    :class='(oneClick ? "q-pr-none q-pl-sm" : "")'
    @click.stop='handleLightningTipClick'
    align="left"
    :size='size'
    unelevated
    :ripple='false'
    dense
    :disable='loading'
  >
    <q-tooltip v-if='!loading'>
      tip with bitcoin lightning network
    </q-tooltip>
    <q-dialog v-model="showLightningCard">
      <BaseLightningCard :ln-string='lnString' :pubkey='pubkey' style='padding: 1.5rem;'/>
    </q-dialog>
  </q-btn>
  <q-btn v-if='oneClick' icon='arrow_drop_down' class='no-padding' dense unelevated :size='size' @click.stop="showLightningCard=!showLightningCard">
  </q-btn>
  </q-btn-group>
</template>

<script>
import { defineComponent } from 'vue'
import helpersMixin from '../utils/mixin'
import BaseLightningCard from 'components/BaseLightningCard.vue'
import {Notify} from 'quasar'

export default defineComponent({
  name: 'BaseButtonLightning',
  mixins: [helpersMixin],
  components: {
    BaseLightningCard
  },

  data() {
    return {
      showLightningCard: false,
      oneClick: this.$store.state.config.preferences.lightningTips.oneClick.enabled,
      amount: this.$store.state.config.preferences.lightningTips.oneClick.amount,
      lnString: this.$store.getters.profileLud06(this.pubkey),
      loading: false,
    }
  },

  props: {
    pubkey: {type: String, required: true},
    size: {
      type: String,
      required: false,
      default: 'sm',
    },
    // verbose: {
    //   type: Boolean,
    //   default: false
    // }
  },

  methods: {
    handleLightningTipClick() {
      if (!window.webln || !this.$store.state.config.preferences.lightningTips.oneClick.enabled) this.showLightningCard = !this.showLightningCard
      else this.sendTip()
    },
    async sendTip() {
      if (!window.webln) return

      this.loading = true
      const invoice = await this.getInvoice(this.lnString, this.amount)
      if (invoice.startsWith('lnurl')) {
        Notify.create({
          message: `invoice couldn't be fetched for ${this.$store.getters.displayName(this.pubkey)}, please use a different pay method`
        })
        this.loading = false
        return
      }

        try {
          await window.webln.sendPayment(invoice)
          Notify.create({
            message: `${this.amount} sats sent to ${this.$store.getters.displayName(this.pubkey)}`
          })
        } catch {
          Notify.create({
            message: `one click tip unsuccessful`
          })
        }

      this.loading = false
    }
  }
})
</script>


<style>
.button-lightning {
  opacity: .7;
  transition: all .3s ease-in-out;
}
.button-lightning:hover {
  opacity: 1;
}
</style>
