<template>
  <div ref='walletPicker' class='wallet-picker flex column no-padding justify-center' style='gap: 1rem; height: 100%; width: 100%'>
    <div class='flex row full-width items-center justify-center'>
      <div >
        <BaseSelect :selecting='showWalletPicker' @toggle='showWalletPicker=!showWalletPicker' style='width: 100%;'>
          <template #default>
            <div v-if='selectedWallet' class='flex row no-wrap items-center q-pa-xs' style='gap: .5rem; font-size: 1.1rem; width: 100%;'>
              <img
                v-if="!loadingInvoice"
                :src="'wallet-icons/' + selectedWallet.image"
                style="height: 1.5rem; width: 1.5rem; border-radius: .3rem;"
              />
              <div>{{selectedWallet.name}}</div>
            </div>
            <div v-else style='font-size: 1.1rem; width: 100%;'> select a wallet </div>
          </template>
          <template #list-items>
            <q-dialog v-model='showWalletPicker'>
            <div class='flex column no-wrap q-pa-sm base-select-list' style='max-height: 80%; gap: .5rem; background: var(--q-background); font-size: 1.1rem;'>
              <li v-for="(wallet, key) in wallets" :key='key' @click.stop='selectWallet(wallet)' class='flex row items-center no-wrap q-pl-xs' style='gap: .5rem;'>
                <img
                  v-if="!loadingInvoice"
                  :src="'wallet-icons/' + wallet.image"
                  style="height: 1.5rem; width: 1.5rem; border-radius: .3rem;"
                />
                <div>{{wallet.name}}</div>
              </li>
            </div>
            </q-dialog>
          </template>
        </BaseSelect>
      </div>
    </div>
    <div v-if='!isInvoice' class='flex row items-center justify-center' style='gap: .7rem;'>
      <div
        id='amount-input'
        contenteditable
        style='font-size: 2rem; padding: 0 .4rem; min-width: 2rem; outline: none; border: none;'
        @input='updateTipAmount'
        @keypress.enter="openInWallet()"
      >
        {{ tipAmount }}
      </div>
      <div style='font-size: 1.1rem;'> sats</div>
    </div>
    <div v-if='!isInvoice' class='flex row justify-center' style='gap: .3rem;'>
      <q-btn v-for='(amount, index) in tipPresets' :key='index' :label='amount + " sats"' size='sm' outline @click.stop='tipAmount=amount'/>
      <q-btn label='other' size='sm' outline @click.stop='focusAmount()'/>

    </div>
    <div class='flex column justify-center items-center' style='font-size: .9rem; width: 100%;'>
      <span v-if='!selectedWallet'>please select a wallet</span>
      <span v-else-if='!isInvoice && selectedWallet && tipAmount === 0'>please enter an amount greater than 0</span>
      <span v-else-if='!isInvoice && selectedWallet && !tipAmount'>please enter an amount</span>
      <q-btn
        v-else
        spread
        outline
        class='full-width'
        :label='(hasWebLn && selectedWallet.prefix === "lightning:") ? "pay" : "open wallet"'
        color="primary"
        v-close-popup
        @click.stop='openInWallet()'
      />
    </div>
  </div>
</template>

<script>
import { defineComponent } from 'vue'
import helpersMixin from '../utils/mixin'
import {Notify} from 'quasar'
// import { requestInvoice } from 'lnurl-pay'
import BaseSelect from 'components/BaseSelect.vue'

export default defineComponent({
  name: 'BaseWallet',
  mixins: [helpersMixin],
  components: {
    BaseSelect
  },

  props: {
    lnString: {
      type: String,
      required: true,
      default: '',
    },
    pubkey: {type: String, default: null},
    bolt11: {type: Object, default: null},
    extended: {
      type: Boolean,
      requred: false,
      default: false,
    },
    size: {
      type: String,
      required: false,
      default: 'sm',
    }
  },

  data() {
    return {
      showWalletPicker: false,
      // fibonacciNum: 0,
      loadingInvoice: false,
      // timer: null,
      tipAmount: this.$store.state.config.preferences.lightningTips.presets[0],
      tipPresets: this.$store.state.config.preferences.lightningTips.presets,
      selectedWallet: null,
      wallets: [
        {
          name: 'system default',
          prefix: 'lightning:',
          image: 'default.png',
        },
        {
          name: 'browser extension (webln)',
          prefix: 'lightning:',
          image: 'webln.jpg',
        },
        {
          name: 'Strike',
          prefix: 'strike:lightning:',
          image: 'strike.jpg',
        },
        {
          name: 'Cash App',
          prefix: 'squarecash://',
          image: 'cashapp.jpg',
        },
        {
          name: 'Muun',
          prefix: 'muun:',
          image: 'muun.jpg',
        },
        {
          name: 'Breez',
          prefix: 'breez:',
          image: 'breez.jpg',
        },
        {
          name: 'Phoenix',
          prefix: 'phoenix://',
          image: 'phoenix.jpg',
        },
        {
          name: 'Wallet of Satoshi',
          prefix: 'walletofsatoshi:lightning:',
          image: 'wos.jpg',
        },
        {
          name: 'Blixt',
          prefix: 'blixtwallet:lightning:',
          image: 'blixt.png',
        },
        {
          name: 'Zeus LN',
          prefix: 'zeusln:lightning:',
          image: 'zeusln.jpg',
        },
        {
          name: 'Bitcoin Beach',
          prefix: 'bitcoinbeach://',
          image: 'bbw.jpg',
        },
      ],
      hasWebLn: false,
      focusAmount() {
        setTimeout(async () => {
          await this.$nextTick()
          this.tipAmount = null
          this.amountInput.focus()
        }, 1)
      },
    }
  },

  computed: {
    amountInput() {
      return this.$refs.walletPicker.querySelector('#amount-input')
    },
    isInvoice() {
      return this.lnString.startsWith('lnbc')
    }
  },

  mounted() {
    this.selectedWallet = this.wallets.find(wallet => wallet.name === this.$store.state.config.preferences.lightningTips.lastWallet)
    this.hasWebLn = window.webln
  },

  methods: {
    selectWallet(wallet) {
      this.selectedWallet = wallet
      this.showWalletPicker = false
    },

    updateTipAmount(e) {
      let amount = e.target.innerText
      let amountRegex = /^[0-9]+$/
      let amountMatch = amount.match(amountRegex)
      if (!amountMatch) {
        this.tipAmount = null
        return
      }
      let parsed = parseInt(amount)
      this.tipAmount = parsed
    },

    async openInWallet() {
      if (!this.selectedWallet || !this.tipAmount) return
      this.$store.commit('setConfigLightningTips', { key: 'lastWallet', value: this.selectedWallet.name })
      let prefix = this.selectedWallet.prefix

      if (!prefix) {
        prefix = 'lightning:'
      }

      this.loadingInvoice = true
      const invoice = await this.getInvoice(this.lnString, this.tipAmount)

      if (invoice.startsWith('lnurl')) {
        Notify.create({
          message: `invoice couldn't be fetched for ${this.$store.getters.displayName(this.pubkey)}, please an different pay method`
        })
        this.loadingInvoice = false
        return
      }

      if (prefix === 'lightning:' && window.webln && invoice.startsWith('lnbc')) {
        try {
          await window.webln.sendPayment(invoice)
          Notify.create({
            message: `${this.bolt11 ? this.bolt11.amount : this.tipAmount} sats sent`
          })
        } catch {
          Notify.create({
            message: `payment unsuccessful`
          })
        }
      } else {
        window.open(`${prefix}${invoice}`, '_self')
      }

      this.loadingInvoice = false
    },

    // async getInvoice(lnString, amount) {
    //   if (lnString.toLowerCase().indexOf('lnbc') === 0) {
    //     return lnString
    //   }

    //   if (!amount) {
    //     return lnString
    //   }

    //   try {
    //     const { invoice } = await requestInvoice({
    //       lnUrlOrAddress: lnString,
    //       tokens: amount, // satoshis
    //       fetchGet: (req) => {
    //         let url = `https://proxy.astral.ninja/${req.url}`

    //         if (!req.params) req.params = { amount }
    //         if (req.params) {
    //           url += '?'
    //           url += new URLSearchParams(req.params)
    //         }

    //         return fetch(url)
    //           .then((res) => res.json())
    //           .catch((err) => {
    //             Notify.create({
    //               message: 'Error fetching invoice from LNURL. ' + err.toString()
    //             })
    //           })
    //       }
    //     })

    //     return invoice
    //   } catch (e) {
    //     Notify.create({
    //       message: 'Error fetching invoice from LNURL. ' + e.toString()
    //     })

    //     return this.lnString
    //   }
    // }
  }
})
</script>

<style lang='css' scoped>
</style>
