<template>
    <img ref='qr' style='object-fit: cover; min-height: 200px; min-width: 200px; width: 100%;'/>
  <!-- <q-item  class='no-padding'>
  </q-item> -->
</template>

<script>
import { defineComponent } from 'vue'
import qrcodegen from 'nayuki-qr-code-generator'

export default defineComponent({
  name: 'BaseQr',

  props: {
    code: {
      type: String,
      required: true
    }
  },

  mounted() {
    let qrImg = this.$refs.qr
    let width = qrImg.clientWidth
    qrImg.style.height = `${width}px`
    this.renderQr()
  },

  methods: {
    renderQr(e) {
      this.showQr = true
      let qr = qrcodegen.QrCode.encodeText(this.code, qrcodegen.QrCode.Ecc.MEDIUM)
      let svgSrc = this.toSvgString(qr, 4)
      this.$refs.qr.src = svgSrc
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
  }
})
</script>

