<template>
  <div ref="src" class="hidden"><slot /></div>
  <div ref="append" class="hidden"><slot name="append" /></div>
  <div v-html="html" />
</template>

<script>
import MarkdownIt from 'markdown-it'
import subscript from 'markdown-it-sub'
import superscript from 'markdown-it-sup'
import deflist from 'markdown-it-deflist'
import taskLists from 'markdown-it-task-lists'
import markdownHighlightJs from 'markdown-it-highlightjs'

import helpersMixin from '../utils/mixin'

const md = MarkdownIt({
  html: false,
  breaks: true,
  linkify: true
})
md.use(subscript)
  .use(superscript)
  .use(deflist)
  .use(taskLists)
  .use(markdownHighlightJs)
  .use(md => {
    md.core.ruler.before('normalize', 'auto-imager', state => {
      state.src = state.src.replace(/https?:[^ ]+/g, m => {
        if (m) {
          let trimmed = m.split('?')[0]
          if (
            trimmed.endsWith('.gif') ||
            trimmed.endsWith('.png') ||
            trimmed.endsWith('.jpeg') ||
            trimmed.endsWith('.jpg') ||
            trimmed.endsWith('.mp4') ||
            trimmed.endsWith('.webm') ||
            trimmed.endsWith('.ogg')
          ) {
            return `![](${m})`
          }
        }

        return m
      })
    })

    md.renderer.rules.image = (tokens, idx) => {
      let src = tokens[idx].attrs[[tokens[idx].attrIndex('src')]][1]
      let trimmed = src.split('?')[0]
      if (
        trimmed.endsWith('.gif') ||
        trimmed.endsWith('.png') ||
        trimmed.endsWith('.jpeg') ||
        trimmed.endsWith('.jpg')
      ) {
        return `<img src="${src}" style="max-width: 90%">`
      } else if (
        trimmed.endsWith('.mp4') ||
        trimmed.endsWith('.webm') ||
        trimmed.endsWith('.ogg')
      ) {
        return `<video controls style="max-width: 90%"><source src="${src}"></video>`
      }
    }
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
ul {
  list-style-type: disc;
  list-style-position: inside;
}
ol {
  list-style-type: decimal;
  list-style-position: inside;
}
ul ul,
ol ul {
  list-style-type: circle;
  list-style-position: inside;
  margin-left: 15px;
}
ol ol,
ul ol {
  list-style-type: lower-latin;
  list-style-position: inside;
  margin-left: 15px;
}
p {
  display: inline;
}
</style>
