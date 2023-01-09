<template>
  <div class='lightning-card'>
    <div class='flex no-wrap justify-between'  :class='rowOrColumn' style='gap: 1rem;'>
      <div style='font-size: .9rem;' :style='rowOrColumn === "row" ? "gap: .5rem;" : "gap: 1rem;"' class='flex column justify-between' :align='rowOrColumn === "row" ? "start" : "center"'>
        <div v-if='pubkey' class='flex column items-center' >
          <span class='text-bold' style='font-size: 1.1rem;'>lightning tip for</span>
          <BaseUserCard :pubkey='pubkey' :action-buttons='false'/>
        </div>
        <div v-else class='text-bold' style='font-size: 1.1rem;'>lightning {{type}}</div>
        <div v-if='bolt11' class='flex column' :class='rowOrColumn === "row" ? "items-start" : "items-center"'>
          <div v-if='bolt11.description'><strong>desc:</strong> {{bolt11.description}}</div>
          <div><strong>amount:</strong> {{bolt11.amount ? `${bolt11.amount} sats` : 'none specified'}}</div>
          <div v-if='bolt11.created'><strong>created date:</strong> {{ dateUTC(bolt11.created) }}</div>
          <div v-if='bolt11.created'><strong>created time:</strong> {{ timeUTC(bolt11.created) }}</div>
          <div v-if='bolt11.expires'><strong>expires date:</strong> {{ dateUTC(bolt11.expires) }}</div>
          <div v-if='bolt11.expires'><strong>expires time:</strong> {{ timeUTC(bolt11.expires) }}</div>
          <div v-if='bolt11.error'><strong>error:</strong> {{bolt11.error}}</div>
        </div>
        <div v-else class='flex column' :class='rowOrColumn === "row" ? "items-start" : "items-center"'>
          <div v-if='request.lnAddr' class='flex row items-center'>
            <span>{{request.lnAddr}}</span>
            <BaseButtonCopy :button-text='request.lnAddr' class='q-pr-xs' @click.stop/>
          </div>
        </div>
          <div class='flex row no-wrap q-pt-xs' style='gap: .5rem;' :class='rowOrColumn === "row" ? " justify-start" : " justify-center"'>
            <BaseButtonCopy :button-text='lnString' button-label='copy' outline class='q-pr-xs' @click.stop='updateMode("copy")'/>
            <q-btn label='qr' icon='qr_code_2' outline size='sm' dense unelevated class='q-pr-xs' @click.stop='updateMode("qr")'/>
            <q-btn label='wallet' icon='wallet' outline size='sm' dense unelevated class='q-pr-xs' @click.stop='updateMode("wallet")'/>
          </div>
      </div>
      <q-tab-panels v-model="mode" style='background: unset;' :style='rowOrColumn === "row" ? "max-width: 50%; width: 50%" : "max-width: 100%; width: 100%"'>
        <q-tab-panel name="copy" class='no-padding flex items-center' :class='rowOrColumn === "row" ? "justify-end" : "justify-center"'>
          <div class='break-word-wrap' style='font-size: .7rem; overflow-y: auto; max-height: 170px; max-width: 200px'>{{ this.lnString.toLowerCase() }}</div>
        </q-tab-panel>
        <q-tab-panel name="qr" class='no-padding flex items-center justify-center'>
          <BaseQr :code='this.lnString' style='height: fit-content;'/>
        </q-tab-panel>
        <q-tab-panel name="wallet" class='no-padding flex items-center justify-center full-width'>
          <BaseWallet :ln-string='lnString' :pubkey='pubkey' :bolt11='bolt11'/>
        </q-tab-panel>
      </q-tab-panels>
    </div>
  </div>
</template>

<script>
import helpersMixin from '../utils/mixin'
import BaseButtonCopy from '../components/BaseButtonCopy'
import BaseQr from 'components/BaseQr'
import BaseWallet from 'components/BaseWallet.vue'
import * as bolt11Parser from 'light-bolt11-decoder'
import { utils } from 'lnurl-pay'

export default {
  name: 'BaseLightningCard',
  mixins: [helpersMixin],
  props: {
    lnString: {type: String, required: true},
    pubkey: {type: String, default: null},
    rowOrColumn: {type: String, default: 'column'}
  },
  components: {
    BaseButtonCopy,
    BaseQr,
    BaseWallet,
  },

  data() {
    return {
      request: {},
      mode: this.$store.state.config.preferences.lightningTips.lastMode,
    }
  },

  computed: {
    bolt11() {
      if (!this.lnString.toLowerCase().startsWith('lnbc')) return null
      try {
        let inv = bolt11Parser.decode(this.lnString)
        let sections = {}
        inv.sections.forEach(({name, value}) => {
          sections[name] = value
        })
        let amount = sections.amount ? sections.amount / 1000 : null
        let description = sections.description
        let created = sections.timestamp
        let expiresValue = sections.expiry
        let parsed = parseInt(expiresValue)
        let expires = isNaN(parsed) ? null : created + parsed
        let request = inv.paymentRequest
        return {
          amount,
          description,
          created,
          expires,
          request
        }
      } catch (error) {
        console.log('invoice parsing error', error)
        let request = this.lnString
        return { error, request }
      }
    },
    type() {
      if (this.lnString.startsWith('lnbc')) return 'invoice'
      return 'lnurl'
    },
  },
  async mounted() {
    if (this.both11) return
    if (!utils.isLnurl(this.lnString)) {
      this.request.error = 'invalid lnurl'
      return
    }

    let lnAddr = this.lnurlToLnAddr(this.lnString)
    if (lnAddr) this.request.lnAddr = lnAddr
  },
  methods: {
    updateMode(mode) {
      this.mode = mode
      this.$store.commit('setConfigLightningTips', { key: 'lastMode', value: mode })
    }
  },
}
</script>

<style lang='scss' scoped>
.lightning-card {
  background: var(--q-background);
  border: 3px double var(--q-accent);
  padding: .5rem;
  margin: .3rem;
}
.q-btn {
  opacity: .7;
  transition: all .3s ease-in-out;
}
.q-btn:hover {
  opacity: 1;
}

</style>

