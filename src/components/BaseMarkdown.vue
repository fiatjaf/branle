<template>
  <div ref="src" class="hidden break-word-wrap"><slot /></div>
  <div ref="append" class="hidden break-word-wrap"><slot name="append" /></div>
  <div v-html="html" class="break-word-wrap dynamic-content" @click='handleClicks'/>
</template>

<script>
import MarkdownIt from 'markdown-it'
import subscript from 'markdown-it-sub'
import superscript from 'markdown-it-sup'
import deflist from 'markdown-it-deflist'
import taskLists from 'markdown-it-task-lists'
import markdownHighlightJs from 'markdown-it-highlightjs'
import emoji from 'markdown-it-emoji'
// import linkPreview from 'markdown-it-link-preview'

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
  .use(emoji)
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
    // pulled from https://github.com/markdown-it/markdown-it/blob/master/docs/architecture.md#renderer
    // Remember old renderer, if overridden, or proxy to default renderer
    var defaultRender = md.renderer.rules.link_open || function(tokens, idx, options, env, self) {
      return self.renderToken(tokens, idx, options)
    }

    md.renderer.rules.link_open = function (tokens, idx, options, env, self) {
      // If you are sure other plugins can't add `target` - drop check below
      var token = tokens[idx]
      var aIndexTarget = token.attrIndex('target')
      var aIndexHref = token.attrIndex('href')
      var httpRegex = /^https?:\/\//

      if (httpRegex.test(token.attrs[aIndexHref][1])) {
        if (aIndexTarget < 0) {
          tokens[idx].attrPush(['target', '_blank']) // add new attribute
        } else {
          tokens[idx].attrs[aIndexTarget][1] = '_blank' // replace value of existing attr
        }
      }

      // pass token to default renderer.
      return defaultRender(tokens, idx, options, env, self)
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
  name: 'BaseMarkdown',
  mixins: [helpersMixin],

  data() {
    return {
      html: '',
      links: [],
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
    },

    handleClicks (event) {
    // ensure we use the link, in case the click has been received by a subelement
    let { target } = event
    // while (target && target.tagName !== 'A') target = target.parentNode
    // handle only links that occur inside the component and do not reference external resources
    if (target && target.matches(".dynamic-content a:not([href*='://'])") && target.href) {
      // some sanity checks taken from vue-router:
      // https://github.com/vuejs/vue-router/blob/dev/src/components/link.js#L106
      const { altKey, ctrlKey, metaKey, shiftKey, button, defaultPrevented } = event
      // don't handle with control keys
      if (metaKey || altKey || ctrlKey || shiftKey) return
      // don't handle when preventDefault called
      if (defaultPrevented) return
      // don't handle right clicks
      if (button !== undefined && button !== 0) return
      // don't handle if `target="_blank"`
      if (target && target.getAttribute) {
        const linkTarget = target.getAttribute('target')
        if (/\b_blank\b/i.test(linkTarget)) return
      }
      // don't handle same page links/anchors
      const url = new URL(target.href)
      const to = url.pathname
      if (window.location.pathname !== to && event.preventDefault) {
        event.preventDefault()
        event.stopPropagation()
        this.$router.push(to)
      }
    // stop propogation of external links
    } else if (target && target.matches(".dynamic-content a[href*='://']") && target.href) {
      event.stopPropagation()
    }
  }
  }
}
</script>

<style lang='scss'>
a {
  text-decoration: underline;
  color: #448195;
}
ul {
  list-style-type: disc;
  list-style-position: outside;
  padding-inline-start: 1rem;
  text-align: left;
}
.post-highlighted ul {
  padding-inline-start: 1.5rem;
}
ol {
  list-style-type: decimal;
  list-style-position: outside;
  padding-inline-start: 1rem;
  text-align: left;
}
.post-highlighted ol {
  padding-inline-start: 1.5rem;
}
ul ul,
ol ul {
  list-style-type: circle;
  list-style-position: outside;
  margin-left: 1rem;
}
ol ol,
ul ol {
  list-style-type: lower-latin;
  list-style-position: outside;
  margin-left: 1rem;
}
p:last-of-type {
  margin: 0
}
.break-word-wrap {
  overflow-wrap: break-word;
  word-wrap: break-word;
  word-break: break-word;
  hyphens: auto !important;
  line-height: 1.3rem !important;
}
</style>

