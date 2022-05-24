<template>
    <q-btn
      v-if='buttonText'
      icon="content_copy"
      unelevated
      clickable
      @click='copy'
      :class='"" + buttonClass'
      :size='buttonSize'
      class='button-copy'
      dense
      :label='verbose ? "copy" : ""'
      align="left"
    >
      <q-tooltip v-if='tooltipText'>
        {{ tooltipText }}
      </q-tooltip>
    </q-btn>
</template>

<script>
import { defineComponent } from 'vue'

export default defineComponent({
  name: 'BaseButtonCopy',
  props: {
    buttonText: {
      type: String,
      required: true
    },
    buttonClass: {
      type: String,
      required: false,
      default: ''
    },
    buttonSize: {
      type: String,
      required: false,
      default: 'sm'
    },
    verbose: {
      type: Boolean,
      default: false,
    },
    tooltipText: {
      type: String,
      required: false,
      default: ''
    },
  },

  methods: {
    copy() {
      let text = this.copyText(this.buttonText)
      console.log(text)
      navigator.clipboard.writeText(text)
    },

    copyText(defaultText) {
      // console.log('defaultText: ', defaultText)
      let selection = window.getSelection().toString()
        // console.log('selection: ', selection)
      if (selection) {
        return selection
      } else return defaultText
    },
  }
})
</script>

<style>
.button-copy {
  opacity: .7;
  transition: all .3s ease-in-out;
}
.button-copy:hover {
  opacity: 1;
}
</style>
