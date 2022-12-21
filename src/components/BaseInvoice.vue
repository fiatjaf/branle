<template>
  <div style='border: 3px double var(--q-accent); padding: .5rem; margin: .3rem;'>
    <div class='flex row no-wrap justify-between full-width'>
      <div style='font-size: .8rem;' :style='showQr ? "" : "width: 60%"' class='flex column'>
        <div class='text-bold' style='font-size: 1.1rem;'>lightning invoice</div>
        <div v-if='description'>desc: {{description}}</div>
        <div>amount: {{amount ? `${amount} sats` : 'none specified'}}</div>
        <div>created date: {{dateUTC(created)}}</div>
        <div>created time: {{ timeUTC(created)}}</div>
        <div v-if='expires'>expires date: {{dateUTC(expires)}}</div>
        <div v-if='expires'>expires time: {{ timeUTC(expires)}}</div>
        <div class='flex row no-wrap justify-start q-pt-xs' style='gap: .5rem;'>
          <BaseButtonCopy :button-text='request' button-label='copy invoice' outline class='q-pr-xs' @click.stop='showQr=false'/>
          <q-btn label='show qr' icon='qr_code_2' outline size='sm' dense unelevated class='q-pr-xs' @click.stop='renderQr'/>
        </div>
      </div>
      <div class='flex column' style='font-size: .7rem; padding: .4rem;' :style='showQr ? "" : "width: 40%"'>
        <div v-if='!showQr' class='break-word-wrap' style='overflow-y: auto; max-height: 170px;'>{{request}}</div>
        <img v-show='showQr' ref='qr' style='object-fit: cover; min-height: 200px; min-width: 200px;'/>
      </div>
    </div>
  </div>
</template>

<script>
import helpersMixin from '../utils/mixin'
import BaseButtonCopy from '../components/BaseButtonCopy'
import qrcodegen from 'nayuki-qr-code-generator'
// import {toSvgString} from 'awesome-qr-code-generator'

export default {
  name: 'BaseInvoice',
  mixins: [helpersMixin],
  props: {invoice: {type: Object, required: true}},
  components: {
    BaseButtonCopy
  },

  data() {
    return {
      showQr: false,
      // links: [],
    }
  },

  computed: {
    includesAmount() {
      if (this.invoice.sections[2].name === 'separator') return false
      return true
    },
    amount() {
      if (this.includesAmount) return this.invoice.sections[2].value / 1000
      return null
    },
    description() {
      if (this.includesAmount) return this.invoice.sections[6].value
      return this.invoice.sections[5].value
    },
    created() {
      if (this.includesAmount) return parseInt(this.invoice.sections[4].value)
      return parseInt(this.invoice.sections[3].value)
    },
    expires() {
      let expiresValue = this.includesAmount ? parseInt(this.invoice.sections[8].value) : parseInt(this.invoice.sections[7].value)
      let parsed = parseInt(expiresValue)
      if (isNaN(parsed)) return null
      return this.created + parsed
    },
    request() {
      return this.invoice.paymentRequest
    }
  },
  mounted() {
    // console.log('invoice', this.invoice)
  },
  methods: {
    renderQr(e) {
      this.showQr = true
      let qr = qrcodegen.QrCode.encodeText(this.request, qrcodegen.QrCode.Ecc.MEDIUM)
      let svgSrc = this.toSvgString(qr, 4)
      this.$refs.qr.src = svgSrc
      console.log('qr', qr)
    },
    toSvgString(qr, border) {
      let lightColor = '#FFFFFF'
      let darkColor = '#000000'
      if (border < 0)
        throw new RangeError('Border must be non-negative')
      let parts = []
      for (let y = 0; y < qr.size; y++) {
        for (let x = 0; x < qr.size; x++) {
          if (qr.getModule(x, y))
            parts.push(`M${x + border},${y + border}h1v1h-1z`)
        }
      }
      let svg = `<svg xmlns="http://www.w3.org/2000/svg" version="1.1" viewBox="0 0 ${qr.size + border * 2} ${qr.size + border * 2}" stroke="none">
	<rect width="100%" height="100%" fill="${lightColor}"/>
	<path d="${parts.join(' ')}" fill="${darkColor}"/>
</svg>
`
      let blob = new Blob([svg], {type: 'image/svg+xml'})
      let url = URL.createObjectURL(blob)
      return url
		}
  },
}
</script>

<style lang='scss' scoped>
.q-btn {
  opacity: .7;
  transition: all .3s ease-in-out;
}
.q-btn:hover {
  opacity: 1;
}

</style>

