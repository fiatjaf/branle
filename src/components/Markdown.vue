<template>
  <div ref="src" class="hidden"><slot /></div>
  <div ref="append" class="hidden"><slot name="append" /></div>
  <div v-html="html" />
</template>

<script>
import MarkdownIt from 'markdown-it'

import helpersMixin from '../utils/mixin'

const md = MarkdownIt({
  html: false,
  breaks: true,
  linkify: true
})
md.linkify
  .tlds(['onion', 'eth'], true)
  .add('bitcoin:', null)
  .add('lightning:', null)
  .set({fuzzyEmail: false})

export default {
  name: 'Markdown',
  mixins: [helpersMixin],

  data() {
    return {
      html: ''
    }
  },

  mounted() {
    this.render()
  },

  updated() {
    this.render()
  },

  methods: {
    render() {
      this.html =
        md.render(this.$refs.src.innerHTML) + this.$refs.append.innerHTML
    }
  }
}
</script>

<style>
a {
  text-decoration: underline;
  color: #448195;
}

p {
  display: inline;
}
</style>
