<template>
  <div ref="src" class="hidden break-word-wrap"><slot /></div>
  <div ref="append" class="hidden break-word-wrap"><slot name="append" /></div>
  <div v-html="html" class="break-word-wrap dynamic-content" @click='handleClicks' :class='longForm ? "long-form" : ""'/>
  <q-btn
    v-if='longForm'
    id='long-form-button'
    dense
    outline
    rounded
    color="accent"
    class='text-weight-light q-ma-sm justify-between'
    style='letter-spacing: .1rem; justify-content: space-between;'
    label='show full post'
    @click.stop="expand"
  />
</template>

<script>
import MarkdownIt from 'markdown-it'
import subscript from 'markdown-it-sub'
import superscript from 'markdown-it-sup'
import deflist from 'markdown-it-deflist'
import taskLists from 'markdown-it-task-lists'
import emoji from 'markdown-it-emoji'

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
  // .use(markdownHighlightJs)
  .use(emoji)
  .use(md => {
    // pulled from https://github.com/markdown-it/markdown-it/blob/master/docs/architecture.md#renderer
    // Remember old renderer, if overridden, or proxy to default renderer
    var defaultRender = md.renderer.rules.link_open || function(tokens, idx, options, env, self) {
      return self.renderToken(tokens, idx, options)
    }

    md.core.ruler.before('normalize', 'auto-imager', state => {
      state.src = state.src.replace(/https?:[^ \n]+/g, m => {
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
      // let classIndex = token.attrIndex('class')
      if (
        trimmed.endsWith('.gif') ||
        trimmed.endsWith('.png') ||
        trimmed.endsWith('.jpeg') ||
        trimmed.endsWith('.jpg')
      ) {
        return `<img src="${src}" crossorigin async style="max-width: 90%; max-height: 50vh;">`
      } else if (
        trimmed.endsWith('.mp4') ||
        trimmed.endsWith('.webm') ||
        trimmed.endsWith('.ogg')
      ) {
        return `<video src="${src}" controls crossorigin async style="max-width: 90%; max-height: 50vh;"></video>`
      }
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

    md.renderer.rules.code_inline = function (tokens, idx, options, env, self) {
      var token = tokens[idx]

      return `<code ${self.renderAttrs(token)}>${token.content}</code>`
    }

    md.renderer.rules.code_block = function (tokens, idx, options, env, self) {
      var token = tokens[idx]

      return `<code ${self.renderAttrs(token)}>${token.content}</code>`
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
  emits: ['expand'],

  data() {
    return {
      html: '',
      links: [],
    }
  },

  props: {
    longForm: {
      type: Boolean,
      default: false
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

    handleClicks(event) {
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
    },
    expand(event) {
      // document.querySelector('#long-form-button').style.display = 'none'
      // document.querySelector('#post-text').classList.remove('long-form')
      this.$emit('expand')
    }
  }
}
</script>

<style lang='scss'>
a {
  text-decoration: underline;
  color: #448195;
}
p {
  margin-block-end: .5rem;
}
ul {
  list-style-type: disc;
}
ol {
  list-style-type: decimal;
}
ul,
ol {
  list-style-position: outside;
  padding-inline-start: 1.5rem;
  margin-block-start: .5rem;
  margin-block-end: .5rem;
  text-align: left;
}
.post-highlighted ul,
.post-highlighted ol {
  padding-inline-start: 2rem;
}
ul ul,
ol ul {
  list-style-type: circle;
  list-style-position: outside;
  margin-left: .5rem;
}
ol ol,
ul ol {
  list-style-type: lower-latin;
  list-style-position: outside;
  margin-left: .5rem;
}

.break-word-wrap p:last-of-type {
  margin: 0;
}
.break-word-wrap {
  word-wrap: break-word;
  word-break: break-word;
}
.break-word-wrap p:has(img),
.break-word-wrap p:has(video) {
  display: inline-block;
}
.break-word-wrap img,
.break-word-wrap video {
  border-radius: 1rem;
  border: 1px solid var(--q-accent);
}
.break-word-wrap pre {
  overflow: auto;
}
.long-form {
  max-height: 10rem;
  overflow-y: hidden;

  /* Permalink - use to edit and share this gradient: https://colorzilla.com/gradient-editor/#000000+0,000000+100&1+0,1+51,0.7+58,0+100 */
  background: -moz-linear-gradient(top, rgba(0,0,0,1) 0%, rgba(0,0,0,1) 51%, rgba(0,0,0,0.7) 58%, rgba(0,0,0,0) 100%); /* FF3.6-15 */
  background: -webkit-linear-gradient(top, rgba(0,0,0,1) 0%,rgba(0,0,0,1) 51%,rgba(0,0,0,0.7) 58%,rgba(0,0,0,0) 100%); /* Chrome10-25,Safari5.1-6 */
  background: linear-gradient(to bottom, rgba(0,0,0,1) 0%,rgba(0,0,0,1) 51%,rgba(0,0,0,0.7) 58%,rgba(0,0,0,0) 100%); /* W3C, IE10+, FF16+, Chrome26+, Opera12+, Safari7+ */
  filter: progid:DXImageTransform.Microsoft.gradient( startColorstr='#000000', endColorstr='#00000000',GradientType=0 ); /* IE6-9 */

  margin: 0;
  padding: 0;
  background-clip: text;
  -webkit-background-clip: text;
  color: transparent;
}
.body--dark .long-form {
  /* Permalink - use to edit and share this gradient: https://colorzilla.com/gradient-editor/#000000+0,000000+100&1+0,1+51,0.7+58,0+100 */
  background: -moz-linear-gradient(top, rgba(255,255,255,1) 0%, rgba(255,255,255,1) 51%, rgba(255,255,255,0.7) 58%, rgba(255,255,255,0) 100%); /* FF3.6-15 */
  background: -webkit-linear-gradient(top, rgba(255,255,255,1) 0%,rgba(255,255,255,1) 51%,rgba(255,255,255,0.7) 58%,rgba(255,255,255,0) 100%); /* Chrome10-25,Safari5.1-6 */
  background: linear-gradient(to bottom, rgba(255,255,255,1) 0%,rgba(255,255,255,1) 51%,rgba(255,255,255,0.7) 58%,rgba(255,255,255,0) 100%); /* W3C, IE10+, FF16+, Chrome26+, Opera12+, Safari7+ */
  filter: progid:DXImageTransform.Microsoft.gradient( startColorstr='#000000', endColorstr='#00000000',GradientType=0 ); /* IE6-9 */

  background-clip: text;
  -webkit-background-clip: text;
}
</style>
