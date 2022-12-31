<template>
  <div ref="src" class="hidden break-word-wrap"><slot /></div>
  <div ref="append" class="hidden break-word-wrap"><slot name="append" /></div>
  <div v-html="html" ref="html" class="break-word-wrap dynamic-content" @click='handleClicks' :class='longForm ? "long-form" : ""'/>
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
  <BaseInvoice v-if='invoice' :invoice='invoice'/>
  <!-- <div v-if='links.length'>
    <BaseLinkPreview v-for='(link, idx) of links' :key='idx' :url='link' />
  </div> -->
</template>

<script>
import MarkdownIt from 'markdown-it'
import subscript from 'markdown-it-sub'
import superscript from 'markdown-it-sup'
import deflist from 'markdown-it-deflist'
import taskLists from 'markdown-it-task-lists'
import emoji from 'markdown-it-emoji'
import helpersMixin from '../utils/mixin'
import * as bolt11Parser from 'light-bolt11-decoder'
import BaseInvoice from 'components/BaseInvoice.vue'
// import fetch from 'cross-fetch'

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
            trimmed.endsWith('.svg') ||
            trimmed.endsWith('.webp') ||
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
        trimmed.endsWith('.jpg') ||
        trimmed.endsWith('.webp') ||
        trimmed.endsWith('.svg')
      ) {
        return `<img src="${src}" async loading='lazy' style="max-width: 90%; max-height: 50vh;">`
      } else if (
        trimmed.endsWith('.mp4') ||
        trimmed.endsWith('.webm') ||
        trimmed.endsWith('.ogg')
      ) {
        return `<video src="${src}" controls async style="max-width: 90%; max-height: 50vh;"></video>`
      }
    }

    md.renderer.rules.link_open = function (tokens, idx, options, env, self) {
      // If you are sure other plugins can't add `target` - drop check below
      var token = tokens[idx]
      var aIndexTarget = token.attrIndex('target')
      var aIndexHref = token.attrIndex('href')

      // twitter doest serve cors headers
      // var twitterRegex = /\bhttps:\/\/(mobile.)?twitter.com\/(?<user>[a-zA-Z0-9_]+)\/status\/(?<status>[0-9]{19})[a-zA-Z0-9_=?&-]*/
      // let twitterMatch = token.attrs[aIndexHref][1].match(twitterRegex)
      // if (twitterMatch) {
      //   let queryUrl = `https://publish.twitter.com/oembed?url=https%3A%2F%2Ftwitter.com%2F${twitterMatch.groups.user}%2Fstatus%2F${twitterMatch.groups.status}`
      //   try {
      //     let response = await fetch(queryUrl)
      //     // if (response && response.html) return response.html
      //     console.log(' fetched tweet', response)
      //   } catch (error) {
      //     // continue
      //     console.log('error fetching tweet', error)
      //   }
      // }
      // console.log('twitterMatch', twitterMatch)

      var ytRegex = /\bhttps:\/\/(www.|m.)?youtu(be.com|.be)\/(watch\?v=|shorts\/)?(?<v>[a-zA-Z0-9_-]{11})(&t=(?<s>[0-9]+)s)?/
      let ytMatch = token.attrs[aIndexHref][1].match(ytRegex)
      // console.log('ytMatch', ytMatch, token.attrs[aIndexHref][1])
      if (ytMatch) {
        let src = `https://www.youtube.com/embed/${ytMatch.groups.v}`
        if (ytMatch.groups.s) src = src + `?start=${ytMatch.groups.s}`
        // src = src + `&origin=http://localhost:8080/`
      console.log('ytMatch', src)
        return `<iframe anonymous async style="height: 15rem; width: 90%; object-fit: cover;" src="${src}"
          title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen>
          </iframe>`
      }

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

    // md.renderer.rules.code_inline = function (tokens, idx, options, env, self) {
    //   var token = tokens[idx]

    //   return `<code ${self.renderAttrs(token)}>${token.content}</code>`
    // }

    // md.renderer.rules.code_block = function (tokens, idx, options, env, self) {
    //   var token = tokens[idx]

    //   return `<code ${self.renderAttrs(token)}>${token.content}</code>`
    // }
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
  emits: ['expand', 'resized'],
  components: {
    BaseInvoice,
  },

  data() {
    return {
      html: '',
      invoice: null,
      // links: [],
    }
  },

  props: {
    content: {
      type: String,
      default: 'todo needs to be updated'
    },
    longForm: {
      type: Boolean,
      default: false
    },
  },

  computed: {
    parsedContent() {
      const bolt11Regex = /\b(?<i>(lnbc|LNBC)[0-9a-zA-Z]*1[0-9a-zA-Z]+)\b/g
      const replacer = (match, index) => {
        try {
          this.invoice = bolt11Parser.decode(match)
          return ''
        } catch (e) {
        console.log('invoice parsing error', e)
          return match
        }
      }
      let replacedContent = this.content.replace(bolt11Regex, replacer)
      return replacedContent
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
      this.html = md.render(this.parsedContent) + this.$refs.append.innerHTML
      // md.render(this.$refs.src.innerHTML) + this.$refs.append.innerHTML
      this.$refs.html.querySelectorAll('img').forEach(img => {
        img.addEventListener('click', (e) => {
          e.stopPropagation()
          if (!document.fullscreenElement) {
            img.requestFullscreen()
          } else if (document.exitFullscreen) {
            document.exitFullscreen()
          }
          this.$emit('resized')
        })
        img.addEventListener('load', (e) => {
          this.$emit('resized')
        })
      })
      // if (this.links.length === 0) {
      //   this.$refs.html.querySelectorAll('a').forEach(link => this.links.push(link.href))
      //   // if (links[0] && links[0].href) this.links.push(links[0].href)
      //   // links.forEach(link => this.links.push(link.href))
      //   console.log('links', this.links)
      // }
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
  max-width: 100%;
}
.break-word-wrap p:has(img),
.break-word-wrap p:has(video) {
  display: inline-block;
}
.break-word-wrap img,
.break-word-wrap video {
  border-radius: 1rem;
  border: 1px solid var(--q-accent);
  display: block;
}
.break-word-wrap pre {
  overflow-x: auto;
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
