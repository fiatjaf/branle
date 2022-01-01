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
  .add('http:', {
    validate(text, pos, self) {
      // copied from linkify defaultSchemas
      var tail = text.slice(pos)
      if (!self.re.http) {
        self.re.http = new RegExp(
          '^\\/\\/' +
            self.re.src_auth +
            self.re.src_host_port_strict +
            self.re.src_path,
          'i'
        )
      }
      if (self.re.http.test(tail)) {
        return tail.match(self.re.http)[0].length
      }
      return 0
    },
    normalize(match, self) {
      if (self.__text_cache__.length < 150 || match.text < 23) {
        return
      }

      let url = new URL(match.url)
      let text = url.host
      if ((url.pathname + url.search + url.hash).length > 10) {
        let suffix = match.text.slice(-7)
        if (suffix[0] === '/') suffix = suffix.slice(1)
        text += `/…/${suffix}`
      }
      match.text = text
    }
  })
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
