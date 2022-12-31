<template>
  <q-item unelevated class='q-pa-none post-entry-form flex coloumn' ref='postEntry' @click.stop @mouseup.stop @keypress.enter.stop @keydown.stop @keyup.stop>

    <div
      v-if='replyMode === "quote" || replyMode === "repost"'
      class='reposts flex column q-px-sm q-py-xs'
      :class='replyMode === "quote" ? "q-mb-sm" : ""'
      :clickable='false'
    >
      <BasePost
        :event='event'
        :clickable='false'
        :is-embeded='true'
        :reply-depth='-1'
      />
    </div>
    <div
      v-if='messageMode === "reply" && event'
      :clickable='false'
      class='embeded-message q-px-sm q-py-xs'
    >
      <div class='relative-position'>
        <q-btn icon="close" flat dense @click.stop='$emit("clear-event")' size='xs' class='absolute-top-right z-top'/>
      </div>
      <BaseMessage
        v-if='event'
        :event='event'
        :clickable='false'
        :is-embeded='true'
      />
    </div>
    <div
      v-show='replyMode !== "repost"'
      class='relative-position full-width'
      style='gap: 5px;'
      @click.stop
    >
      <!-- <div style='max-height: 0; overflow: visible; position: relative; z-index: 5;'> -->
      <q-list id='tribute-wrapper' class='overflow-auto flex row z-top' style='max-height: 40vh' @click.stop='focusInput'>
      </q-list>
      <!-- </div> -->
      <div v-if='!messageMode && replyUserTags.length  && this.replyMode !== "embed"' class='flex row items-center' style='gap: .3rem;'>
        <q-icon name='alternate_email' color='secondary' size='sm'/>
        <q-btn
          v-for='pubkey in replyUserTags'
          :key='pubkey'
          color='secondary'
          outline
          rounded
          :label='$store.getters.displayName(pubkey)'
          icon='close'
          dense
          size='sm'
          class='q-pr-sm'
          no-caps
          @click.stop='removeReplyUserTag(pubkey)'
        />
      </div>
      <div class="input-area">
        <BaseUserAvatar :pubkey='$store.state.keys.pub' class='avatar-image' />
        <span id="input-placeholder"> {{ placeholderText }}</span>
        <div v-show='!longForm' id="input-readonly-highlight" contenteditable="true" spellcheck="false"></div>
        <div
          id="input-editable"
          :contenteditable="!sending && !mentionsUpdating"
          :style='mentionsUpdating ? "opacity: .7;" : ""'
          @input='updateText'
          @keypress.delete='updateText'
          @focus='textareaFocus'
          @blur='textareaBlur'
          @keypress.ctrl.enter="send"
          @click.stop='updateText'
          @touchstart.stop
          @mousedown.stop
        >
        </div>
        <div id="input-readonly" contenteditable="true" spellcheck="false"></div>
        <div v-if='mentionsUpdating' class='absolute-top full-width row justify-center q-my-md'>
          <q-spinner-orbit color="accent" size='md'/>
        </div>
      </div>
    </div>
    <div style='font-size: .9rem;'>
      <div v-if='links.length' class='q-pl-xs'>
        <div class='text-secondary'>links added</div>
        <ul dense style='font-size: .8rem; font-weight: 300;'>
          <li v-for='(link, index) in links' :key='index' class='flex row justify-between no-wrap' dense>
            <div class='col-11' style='overflow-x: auto'>
            <strong>{{ linkName(link) }}</strong>
            <span>{{ link.url }}</span>
            </div>
            <q-btn icon="remove_circle" clickable @click.stop='removeLink(index)' flat color="negative" size='xs' class='no-padding'/>
          </li>
        </ul>
      </div>
    </div>
    <div class='flex justify-between' :class='toolSelected ? "column" : "row"' @click.stop>
      <div class='flex row justify-between'>
        <q-btn-toggle
          v-show='replyMode !== "repost"'
          v-model='toolSelected'
          class='flex'
          dense
          unelevated
          toggle-color=''
          toggle-text-color='accent'
          :class='toolSelected ? "column" : "row"'
          :options="[
            {value: 'emoji', slot: 'emoji'},
            {value: 'link', slot: 'link'},
            {value: 'help', slot: 'help'},
            ]"
        >
          <template #emoji>
            <q-btn
              unelevated
              class='no-padding button-emoji'
              dense
              size='sm'
              @click.stop='toggleTool("emoji")'
            >
              <q-icon>
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24"><path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0m0 22C6.486 22 2 17.514 2 12S6.486 2 12 2s10 4.486 10 10-4.486 10-10 10"/><path d="M8 7a2 2 0 1 0-.001 3.999A2 2 0 0 0 8 7M16 7a2 2 0 1 0-.001 3.999A2 2 0 0 0 16 7M15.232 15c-.693 1.195-1.87 2-3.349 2-1.477 0-2.655-.805-3.347-2H15m3-2H6a6 6 0 1 0 12 0"/></svg>
              </q-icon>
              <q-tooltip>
                add emoji
              </q-tooltip>
            </q-btn>
          </template>
          <template #link>
            <q-btn
              unelevated
              class='no-padding button-link'
              dense
              size='sm'
              @click.stop='toggleTool("link")'
            >
              <q-icon name='add_link' size='sm'/>
              <!-- </q-icon> -->
              <q-tooltip>
                add link
              </q-tooltip>
            </q-btn>
          </template>
          <template #help>
            <q-btn
              unelevated
              class='no-padding button-link'
              dense
              size='sm'
              @click.stop='toggleTool("help")'
            >
              <q-icon name='help' size='xs'/>
              <!-- </q-icon> -->
              <q-tooltip>
                how to mention users and posts
              </q-tooltip>
            </q-btn>
          </template>
          <!-- <template #image>
            <q-btn
              unelevated
              class='no-padding button-image'
              dense
              flat
              size='sm'
              icon='image'
              @click.stop='toggleTool("image")'
            />
          </template> -->
        </q-btn-toggle>
        <q-item v-if='toolSelected' class='col toolbox no-padding' ref='toolbox'>
          <q-separator vertical color='accent' size='1px'/>
          <q-tab-panels
            v-model="toolSelected"
            class='no-padding full-width'
          >
            <q-tab-panel name="emoji" class='no-padding' @click.stop>
              <BaseEmojiPicker
                @emoji-selected='insertEmoji'
                :per-line='emojiPerRow'
                class='full-width'
              />
            </q-tab-panel>
            <q-tab-panel name="link" class='q-pa-xs' @click.stop>
              <BaseLinkForm
                :links='links'
                @link-added='addLink'
              />
            </q-tab-panel>
            <q-tab-panel name="help" class='q-pa-xs' @click.stop>
              <div>
                <span class='text-bold'>{{ "to mention a user: "}}</span>
                {{ "type "}}
                <code>{{`"@"`}}</code>
                {{ " and select user from menu that pops up or paste in npub key"}}
                <!-- <code>{{`"@<pubkey-id>"`}}</code> -->
              </div>
              <!-- <br> -->
              <div>
                <span class='text-bold'>{{ "to mention a post: "}}</span>
                <span>paste in note id (you can copy note id from embed <q-icon name='link' size='sm'/> button at the bottom of every post)"</span>
                <!-- <code>{{`"&<event-id>"`}}</code> -->
              </div>
            </q-tab-panel>
          </q-tab-panels>
        </q-item>
      </div>
      <q-btn-group class='flex items-center' unelevated>
        <q-btn
          v-if='toolSelected'
          icon="close"
          unelevated
          class='col button-close'
          dense
          @click.stop='closeTools'
        >
          <q-tooltip>
            cancel
          </q-tooltip>
        </q-btn>

        <!-- <div v-if='charLeft() <= 0'>
          <input type="checkbox" id="long-form-checkbox" name="long-form-checkbox">
          <label for="long-form-checkbox">long form</label>
        </div> -->

        <!-- <q-checkbox v-if='charLeft() <= 0' v-model="shortLong" label="long form" color="primary" size='xs'/> -->
        <!-- <q-btn-toggle
          v-model="shortLong"
          outline
          toggle-color="primary"
          color="white"
          text-color="primary"
          :options="[
            {icon: 'short_text', value: 'short'},
            {icon: 'article', value: 'long'}
          ]"
        /> -->
        <div v-if='text && !messageMode' class='char-left-label'>
          <span v-if='(charLeft() <= 0) && !longForm' class='over-limit'>{{ charLeft() }}</span>
          <q-circular-progress
            v-if='charLeft() > 0'
            :show-value='charLeft() <= 25'
            :value='((text.length % charLimit) / charLimit) * 100'
            :size="charLeft() <= 25 ? '1.5rem' : '1.2rem'"
            font-size='.6rem'
            :thickness="charLeft() <= 25 ? .2 : .1"
            :color="charLeft() <= 25 ? 'warning' : 'secondary'"
            track-color='transparent'
            class="no-padding"
            instant-feedback
          >
            {{ charLeft() }}
          </q-circular-progress>
        </div>
        <q-btn-toggle
          v-if='!messageMode && (charLeft() <= 0)'
          v-model="longForm"
          unelevated
          dense
          toggle-color="primary"
          style='border: 1px solid var(--q-primary)'
          text-color="primary"
          class='q-ml-md'
          :options="[
            {value: false, slot: 'short'},
            {value: true, slot: 'long'}
          ]"
        >
          <template #short>
            <q-icon name='short_text' size='xs' :style='longForm ? "" : "color: var(--q-background"'/>
            <q-tooltip>
              short form post
            </q-tooltip>
          </template>
          <template #long>
            <q-icon name='format_align_left' size='xs' :style='longForm ? "color: var(--q-background" : ""'/>
            <q-tooltip>
              long form post
            </q-tooltip>
          </template>
        </q-btn-toggle>
        <q-btn
          flat
          unelevated
          color="primary"
          type="submit"
          @click.stop='send'
          :disable='!textValid()'
        >
          <q-icon name="send" :style='"transform: translateX(" + sendIconTranslation + "px);"'/>
        </q-btn>
      </q-btn-group>
    </div>
  </q-item>
</template>

<script>
import { colors } from 'quasar'
const { getPaletteColor } = colors
import helpersMixin from '../utils/mixin'
import {getPubKeyTagWithRelay, getEventIdTagWithRelay} from '../utils/helpers'
import {cleanEvent} from '../utils/event'
import BaseEmojiPicker from 'components/BaseEmojiPicker.vue'
import BaseLinkForm from 'components/BaseLinkForm.vue'
import BaseMessage from 'components/BaseMessage.vue'
import {publish} from '../query'
// import { ref } from 'vue'

export default {
  name: 'BasePostEntry',
  mixins: [helpersMixin],
  emits: ['sent', 'resized', 'clear-event'],
  components: {
    BaseEmojiPicker,
    BaseLinkForm,
    BaseMessage,
  },

  props: {
    messageMode: {
      type: String,
      required: false,
      default: ''
    },
    replyMode: {
      type: String,
      required: false,
      default: ''
    },
    event: {
      type: Object,
      required: false,
      default: null
    },
    autoFocus: {
      type: Boolean,
      default: true
    }
  },

  data() {
    return {
      text: '',
      charLimit: 280,
      sending: false,
      toolSelected: '',
      sendIconTranslation: 0,
      tags: [], // tags in the content (user added)
      mentionsUpdating: false,
      focusInput() {
        setTimeout(async () => {
          await this.$nextTick()
          this.textarea.focus()
        }, 1)
      },
      trigger: 1,
      links: [],
      textareaRange: null,
      // shortLong: 'short',
      longForm: false,
      replyUserTags: [] // tags from previous reply authors
    }
  },

  watch: {
    text(curr, prev) {
      this.updateMentionsTags()
    },
    replyMode(curr, prev) {
      if (curr !== prev) {
        this.$emit('resized')
        this.focusInput()
      }
    },
    messageMode(curr, prev) {
      if (curr !== prev) {
        this.$emit('resized')
        this.focusInput()
      }
    },
  },

  computed: {
    postEntry() {
      return this.$refs.postEntry.$el
    },
    textarea() {
      return this.postEntry.querySelector('#input-editable')
    },
    readonlyTextarea() {
      return this.postEntry.querySelector('#input-readonly')
    },
    readonlyHighlightTextarea() {
      return this.postEntry.querySelector('#input-readonly-highlight')
    },
    placeholder() {
      return this.postEntry.querySelector('#input-placeholder')
    },
    profileMentionsProvider() {
      return this.createMentionsProvider()
    },
    postEntryWidth() {
      return this.$refs.postEntry?.$el?.clientWidth
    },
    toolboxWidth() {
      if (this.toolSelected) return this.$refs.toolbox?.$el?.clientWidth
      return 0
    },
    emojiPerRow() {
      if (this.toolboxWidth) return Math.floor((this.toolboxWidth - 10) / 25)
      return 0
    },
    label() {
      if (this.messageMode === 'reply') return "what's your reply?"
      else if (this.messageMode) return "what's your message?"
      else if (this.replyMode) {
        if (this.replyMode === 'reply') return "what's your reply?"
        else if (this.replyMode === 'quote') return "what's your thought?"
      }
      return "what's happening?"
    },
    placeholderText() {
      if (this.text.length) return ''
      else if (this.messageMode === 'reply') return 'reply to message'
      else if (this.messageMode) return "what's your message?"
      else if (this.replyMode) {
        if (this.replyMode === 'reply') return "what's your reply?"
        else if (this.replyMode === 'quote') return "what's your thought on this?"
      }
      return "what's happening?"
    },
    textareaMentions() {
      return this.mentions()
    },
    hashtags() {
      if (this.text.length === 0) return []
      const hashtagRegex = /(?<s>^|[\s])#(?<i>[\w]{1,63})/g
      let matches = this.text.matchAll(hashtagRegex)
      let hashtags = []
      for (let match of matches) {
        hashtags.push(match.groups.i.toLowerCase())
      }
      return hashtags
    },
    caretRange() {
      const isSupported = typeof window.getSelection !== 'undefined'
      if (isSupported && this.trigger) {
        const sel = window.getSelection()
        if (sel.rangeCount !== 0) {
          const range = sel.getRangeAt(0)
          return range
        }
      }
      return null
    },
    hexPubkey() {
      if (this.$route.params.pubkey) return this.bech32ToHex(this.$route.params.pubkey)
      return ''
    }
  },

  mounted() {
    if (!this.messageMode) this.profileMentionsProvider.attach(this.textarea)
    if (this.replyMode) this.replyUserTags = this.getReplyUserTags()
    if (this.autoFocus) this.focusInput()
    this.$emit('resized')
  },

  activated() {
    // if (this.autoFocus) this.focusInput()
  },

  beforeUnmount() {
    if (!this.messageMode) this.profileMentionsProvider.detach(this.textarea)
    this.reset()
    this.$emit('resized')
  },

  methods: {
    updateText(e) {
      this.trigger++
      // if (e) this.text = e.target.textContent
      // else this.text = this.textarea.textContent
      this.text = this.textarea.textContent
      this.textareaRange = this.caretRange
      this.updateReadonlyInput()
      if (!this.messageMode) this.updateReadonlyHightlightInput()
    },

    async send() {
      if (!this.textValid()) {
        console.log('text not valid')
        return
      }
      if (this.sending) {
        console.log('send already in progress')
        return
      }
      this.toolSelected = ''
      this.sending = true
      this.animateSendIcon()
      await this.extractMentions(this.textarea, this.tags)
      let event
      if (this.replyMode) event = await this.sendReply()
      else if (this.messageMode) event = await this.sendMessage()
      else event = await this.sendPost()
      if (event) {
        if (!this.messageMode) this.interpolateEventMentions(event)
        this.reset()
        this.$emit('sent', event)
        if (!this.replyMode && !this.messageMode) this.toEvent(event.id)
      }
      this.sending = false
    },

    async sendPost() {
      let tags = Object.values(this.mentions()).map(mention => mention.tag)
      let text = await this.formatMentionsForPublishing(tags)
      this.appendHashtags(tags)
      text = this.appendLinks(text)

      // console.log('sendPost:', tags, this.tags, text)
      let event = await this.$store.dispatch('sendPost', {message: text, tags})
      if (event) {
        return event
      }
    },

    async sendReply() {
      // build tags
      // let tags = []
      if (this.replyMode === 'repost' && this.text) this.textarea.innerHTML = ''

      // save copy of mentions and remove for now
      // let mentions = Object.assign({}, this.mentions())
      let tags = []
      let textarea = this.textarea.cloneNode(true)

      this.replyUserTags.forEach(async (pubkey) => tags.push(await getPubKeyTagWithRelay(pubkey)))
      // // remove invalid tags and/or not p/e
      // let usableTags = this.event.tags.filter(
      //   ([t, v]) => (t === 'p' || t === 'e') && v
      // ).map(([...values]) => { return [...values] })

      // // add last 4 pubkeys mentioned
      // let pubkeys = usableTags.filter(([t, v]) => t === 'p').map(([_, v]) => v)
      // // console.log('pubkeys: ', pubkeys)
      // for (let i = 0; i < Math.min(4, pubkeys.length); i++) {
      //   tags.push(await getPubKeyTagWithRelay(pubkeys[pubkeys.length - 1 - i]))
      // }
      // // plus the author of the note being replied to, if not present already
      // if (!tags.find(([_, v]) => v === this.event.pubkey)) {
      //   tags.push(await getPubKeyTagWithRelay(this.event.pubkey))
      // }
      // // remove ourselves
      // tags = tags.filter(([_, v]) => v !== this.$store.state.keys.pub)
        // console.log('tags: ', tags)
      // add quoted/reposted event
      // remove invalid tags and/or not e
      let usableTags = this.event.tags.filter(
        ([t, v]) => (t === 'e') && v
      ).map(([...values]) => { return [...values] })
      if (this.replyMode === 'quote' || this.replyMode === 'repost') {
        // if quote or repost, only tag this event and add mention to text
        let last = await getEventIdTagWithRelay(this.event.id, 'mention')
        tags.push(last)
        // text += ` #[${tags.length - 1}]`
        textarea.append(` #[${tags.length - 1}]`)
      } else {
        // add the first and the last events being replied to
        let first = usableTags.find(([t, _, __, marker]) => t === 'e' && marker === 'root') || usableTags.find((tag) => tag[0] === 'e' && !tag[3])
        if (!first && usableTags.filter(([t, _, __, marker]) => t === 'e' && marker === 'reply').length === 1)
          first = usableTags.find(([t, _, __, marker]) => t === 'e' && marker === 'reply')
        if (first) {
          tags.push(await getEventIdTagWithRelay(first[1], 'root'))
          tags.push(await getEventIdTagWithRelay(this.event.id, 'reply'))
        } else {
          tags.push(await getEventIdTagWithRelay(this.event.id, 'root'))
        }
      }

      // let text = this.textarea.innerText
      // let text = await this.formatMentionsForPublishing(tags)
      let text = await this.formatMentionsForPublishing(tags, true, textarea)
      this.appendHashtags(tags)
      text = this.appendLinks(text)
      // console.log('sendReply', {
      //   message: text,
      //   tags: tags
      // })
      publish(cleanEvent(this.event))
      return await this.$store.dispatch('sendPost', {
        message: text,
        tags: tags
      })
    },

    async sendMessage() {
      let now = Math.round(Date.now() / 1000)
      // let mentions = Object.assign({}, this.mentions())
      let tags = []
      // add the pubkey of the person we are messaging
      if (!tags.find(([_, v]) => v === this.hexPubkey)) {
          tags.push(['p', this.hexPubkey])
      }
      if (this.event && !tags.find(([_, v]) => v === this.event.id)) {
          tags.push(await getEventIdTagWithRelay(this.event.id, 'mention'))
          // tags.push(['e', this.event.id])
      }
      // this.tags = this.tags.filter(([_, v]) => v !== this.$store.state.keys.pub)
      // let text = this.formatMentionsForPublishing(text, tags, mentions)
      let text = await this.formatMentionsForPublishing(tags, false)
      text = this.appendLinks(text)

      // console.log('sendChatMessage', {
      //   now,
      //   pubkey: this.hexPubkey,
      //   text,
      //   tags
      // })
      return await this.$store.dispatch('sendChatMessage', {
        now,
        pubkey: this.hexPubkey,
        text,
        tags
      })
    },

    // async extractMentions(text, tags) {
    async extractMentions(el, tags) {
      // const mentionRegex = /\B@(?<p>[a-f0-9]{64})\b/g
      // const mentionRegex = /@((?<t>[a-z]{1}):{1})?(?<p>[a-f0-9]{64})\b/g
      const mentionRegex = /(?<t>note|npub)(?<v>[a-z0-9]{59})\b/g
      const textNodeTreeWalker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT, null, false)
      let tagIndexMap = {}
      let node = textNodeTreeWalker.nextNode()
      while (node) {
        let text = node.textContent
        for (let match of text.matchAll(mentionRegex)) {
          let type = null
          if (match.groups.t === 'note') type = 'e'
          else if (match.groups.t === 'npub') type = 'p'
          else return
          let value = match[0]
          let hexValue = this.bech32ToHex(value)
          let tagEntries = Object.entries(tags)
          let idx = tagEntries
            .map(([_, tag]) => tag)
            .findIndex(([t, v]) => t === type && v === value)
          if (idx !== -1) {
            tagIndexMap[value] = tagEntries[idx][0]
          } else {
            if (type === 'e') {
              let mention = `${this.shorten(value)}`
              tags[mention] = await getEventIdTagWithRelay(hexValue, 'mention')
              tagIndexMap[value] = mention
            } else {
              console.log('extract mentions', `"${value}"`, match)
              let mention = `@${this.$store.getters.displayName(hexValue)}`
              tags[mention] = await getPubKeyTagWithRelay(hexValue)
              tagIndexMap[value] = mention
            }
          }
        }

        text = text.replace(
          mentionRegex,
          (match, __, value) => tagIndexMap[match]
        )

        node.textContent = text
        node = textNodeTreeWalker.nextNode()
      }
    },


    mentions(el = this.textarea) {
      if (this.text.length === 0) return {}

      let mentions = {}
      const textNodeTreeWalker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT, null, false)
      let node = textNodeTreeWalker.nextNode()
      let nodeCnt = 0
      while (node) {
        for (let [key, tag] of Object.entries(this.tags)) {
          const mentionAnchorRegex = new RegExp(`(?<i>${key})\\b`, 'g')
          let matches = node.textContent.matchAll(mentionAnchorRegex)
          for (let match of matches) {
            if (this.tags[match.groups.i]) mentions[nodeCnt + '.' + match.index + '_' + match.groups.i] = {
              el: node,
              pos: match.index,
              tag: Array.from(tag),
              length: match.groups.i.length,
            }
          }
        }
        node = textNodeTreeWalker.nextNode()
        nodeCnt++
      }
      return mentions
    },

    async formatMentionsForPublishing(tags, parseProfile = true, textarea = this.textarea.cloneNode(true)) {
      // let textarea = this.textarea.cloneNode(true)
      let mentions = this.mentions(textarea)
      let last = { el: null, offset: null}
      for (let key in mentions) {
        let mention = mentions[key]
        let idx = tags.findIndex(([t, v]) => t === mention.tag[0] && v === mention.tag[1])
        // console.log('idx', idx)
        if (idx === -1) {
          let tag
          if (mention.tag[0] === 'p' && parseProfile) tag = await getPubKeyTagWithRelay(mention.tag[1])
          else if (mention.tag[0] === 'e') tag = await getEventIdTagWithRelay(mention.tag[1], 'mention')
          if (tag) {
            tags.push(tag)
            idx = tags.length - 1
          }
        }
        if (last.el && last.el !== mention.el) last.offset = 0
        let offset = (last.el && last.el === mention.el) ? last.offset : 0
        let range = new Range()
        range.setStart(mention.el, mention.pos + offset)
        range.setEnd(mention.el, mention.pos + mention.length + offset)
        let newText = (mention.tag[0] === 'p' && !parseProfile) ? `@${mention.tag[1]}` : `#[${idx}]`
        this.insertText(newText, range)
        last = {
          el: mention.el,
          offset: newText.length - mention.length + last.offset || 0
        }
        // if (mention.tag[0] === 'p' && !parseProfile) {
        //   this.insertText(`@${mention.tag[1]}`, range)
        // } else this.insertText(`#[${idx}]`, range)
      }
      textarea.style.maxHeight = '0'
      this.postEntry.appendChild(textarea)
      let text = textarea.innerText
      textarea.remove()
      return text
    },

    async updateMentionsTags() {
      this.trigger++
      let { start } = this.startEndOfRange()
      const mentionRegex = /(?<t>note|npub)(?<v>[a-z0-9]{59})/g
      if (this.text.toLowerCase().match(mentionRegex)) {
        this.mentionsUpdating = true
        await this.extractMentions(this.textarea, this.tags)
        if (start.el.nodeName === '#text' && start.pos > start.el.length)
          this.setCaret(start.el, start.el.length)
        else this.setCaret(start.el, start.pos)
        this.updateText()
        console.log('updateMentionTags', this.tags)
        Object.keys(this.tags).filter((key) => this.tags[key][0] === 'p').forEach((key) => {
          if (!this.replyUserTags.includes(this.tags[key][1])) this.replyUserTags.push(this.tags[key][1])
        })
        this.mentionsUpdating = false
      }
    },

    startEndOfRange(range = this.caretRange) {
      return {
        start: {el: range.startContainer, pos: range.startOffset},
        end: {el: range.endContainer, pos: range.endOffset}
      }
    },

    insertText(insertedText, range = this.textareaRange) {
      let { start, end } = this.startEndOfRange(range)
      let text = start.el.textContent.slice(0, start.pos) + insertedText + end.el.textContent.slice(end.pos)
      // let nextSibling = end.el.nextSibling
      // while (nextSibling?.nodeName === '#text') {
      //   text = text + nextSibling.textContent
      //   let newNextSibling = nextSibling.nextSibling
      //   nextSibling.remove()
      //   nextSibling = newNextSibling
      // }
      if (!range.isCollapsed) {
        range.deleteContents()
        if (end.el !== start.el) end.el.remove()
      }
      if (start.el.nodeName === '#text') {
        start.el.textContent = text
        this.setCaret(start.el, start.pos + insertedText.length)
      } else {
        let textNode = document.createTextNode(text)
        start.el.insertBefore(textNode, start.el.firstChild)
        this.setCaret(textNode, insertedText.length)
      }
      this.updateText()
    },

    insertEmoji(emoji) {
      this.trigger++
      this.insertText(emoji.native)
    },

    animateSendIcon() {
      let interval = setInterval(() => {
        if (!this.sending) {
          clearInterval(interval)
          this.sendIconTranslation = 0
          return
        }
        this.sendIconTranslation += 3
        if (this.sendIconTranslation > 50) this.sendIconTranslation -= (this.postEntryWidth + 40)
      }, 50)
    },

    closeTools() {
      this.toolSelected = ''
    },

    toggleTool(tool) {
      this.updateText()
      if (this.toolSelected === tool) this.closeTools()
      else this.toolSelected = tool
    },

    reset() {
      this.closeTools()
      this.text = ''
      this.textarea.innerHTML = ''
      this.readonlyTextarea.innerHTML = ''
      this.readonlyHighlightTextarea.innerHTML = ''
      this.tags = []
      this.links = []
      this.focusInput()
    },

    appendHashtags(tags) {
      for (let hashtag of this.hashtags) {
        if (!tags.find(([_, v]) => v === hashtag)) {
          tags.push(['t', hashtag.toLowerCase()])
        }
      }
    },

    appendLinks(text) {
      for (let link of this.links) {
        if (link.name) text = text + `\n[${link.name}](${link.url})`
        else text = text + `\n${link.url}`
      }
      return text
    },

    setCaret(el, pos) {
      const isSupported = typeof window.getSelection !== 'undefined'
      if (isSupported && el) {
        const sel = window.getSelection()
        const range = document.createRange()
        sel.removeAllRanges()
        range.selectNodeContents(el)
        range.collapse(true)
        // range.setEnd(el, 0)
        range.setStart(el, pos)
        sel.addRange(range)
        this.focusInput()
      }
    },

    addLink(link) {
      this.links.push(link)
    },

    linkName(link) {
      if (link.name) return `${link.name}: `
      return ''
    },

    removeLink(index) {
      this.links.splice(index, 1)
    },

    textareaFocus(e) {
      const placeholder = this.placeholder
      placeholder.style.opacity = '.3'
    },

    textareaBlur(e) {
      const placeholder = this.placeholder
      placeholder.style.opacity = '.6'
    },

    colorText(text) {
      let span = document.createElement('span')
      span.innerHTML = text
      span.style.color = getPaletteColor('secondary')
      return span
    },

    updateReadonlyInput() {
      // update user and event text coloring
      let readonlyTextareaHtml = this.textarea.innerHTML
      let mentions = Object.assign({}, this.mentions())
      for (let key in mentions) {
        let [_, mentionText] = key.split('_')
          const mentionAnchorRegex = new RegExp(`(?<i>${mentionText})\\b`, 'g')
          readonlyTextareaHtml = readonlyTextareaHtml.replaceAll(
            mentionAnchorRegex,
            (_, value) => this.colorText(mentionText).outerHTML
          )
        }
      this.readonlyTextarea.innerHTML = readonlyTextareaHtml
    },

    updateReadonlyHightlightInput() {
      // update over char limit highlighting
      if (this.overCharLimit()) {
        this.readonlyHighlightTextarea.innerHTML = this.textarea.innerHTML
        let { el, pos } = this.charPos(this.charLimit, this.readonlyHighlightTextarea)
        let midword = el.length && el.length > pos
        let highlightRange = new Range()
        highlightRange.setStart(el, pos)
        highlightRange.setEndAfter(this.readonlyHighlightTextarea.lastChild)
        let highlightFragment = highlightRange.extractContents()
        let htmlContent = [].map.call(highlightFragment.childNodes, (child, index) => {
          if (index === 0 && midword) {
            if (child.nodeName === '#text') return child.textContent
            else return child.innerHTML
          }
          let span = document.createElement('span')
          span.style.background = getPaletteColor('negative')
          span.style.opacity = '.6'
          span.innerHTML = child.innerHTML
          child.innerHTML = span.outerHTML
          return child.outerHTML
        }).join('')

        let span = document.createElement('span')
        span.innerHTML = htmlContent
        span.style.background = getPaletteColor('negative')
        span.style.opacity = '.6'
        let range = new Range()
        range.setStart(el, pos)
        range.collapse(true)
        range.insertNode(span)
      } else this.readonlyHighlightTextarea.innerHTML = ''
    },

    charPos(char, el = this.textarea) {
    // Loop through all child nodes
      for (var node of el.childNodes) {
        if (node.nodeType === 3) { // we have a text node
          if (node.length >= char) {
              return { el: node, pos: char, char: -1 }
          } else {
              char -= node.length
          }
        } else {
            let result = this.charPos(char, node)
            if (result.char === -1) {
                return result // no need to finish the for loop
            } else char = result.char
        }
      }
      return { char } // needed because of recursion stuff
    },

    // handlePaste(e) {
    //   let clipboardData = e.clipboardData || e.originalEvent.clipboardData || window.clipboardData
    //   let pastedText = clipboardData.getData('text/plain') || clipboardData.getData('Text')
    //   let pastedTextNew = this.extractUrls(pastedText)
    //   // console.log('pastedText', pastedText, 'pastedTextNew', pastedTextNew)
    //   if (pastedText !== pastedTextNew) {
    //     e.preventDefault()
    //     this.trigger++
    //     this.insertText(pastedTextNew)
    //   }
    // },

    extractUrls(text) {
      // eslint-disable-next-line no-useless-escape
      // const urlRegex = /(?:(?:https?|ftp):\/\/|\b(?:[a-z\d]+\.))(?:(?:[^\s()<>]+|\((?:[^\s()<>]+|(?:\([^\s()<>]+\)))?\))+(?:\((?:[^\s()<>]+|(?:\(?:[^\s()<>]+\)))?\)|[^\s`!()\[\]{};:'".,<>?«»“”‘’]))?/ig
      const urlRegex = /^(?:(?:https?|ftp):\/\/)(?:\S+(?::\S*)?@)?(?:(?!(?:10|127)(?:\.\d{1,3}){3})(?!(?:169\.254|192\.168)(?:\.\d{1,3}){2})(?!172\.(?:1[6-9]|2\d|3[0-1])(?:\.\d{1,3}){2})(?:[1-9]\d?|1\d\d|2[01]\d|22[0-3])(?:\.(?:1?\d{1,2}|2[0-4]\d|25[0-5])){2}(?:\.(?:[1-9]\d?|1\d\d|2[0-4]\d|25[0-4]))|(?:(?:[a-z\u00a1-\uffff0-9]-*)*[a-z\u00a1-\uffff0-9]+)(?:\.(?:[a-z\u00a1-\uffff0-9]-*)*[a-z\u00a1-\uffff0-9]+)*(?:\.(?:[a-z\u00a1-\uffff]{2,}))\.?)(?::\d{2,5})?(?:[/?#]\S*)?$/i

      text = text.replace(
        urlRegex,
        (url) => {
          this.addLink({ url })
          return ''
        }
      )

      return text
    },
    charLeft() {
      return this.charLimit - this.text.length
    },
    overCharLimit() {
      return this.charLeft() < 0
    },
    textValid() {
      if (this.replyMode === 'repost') return true
      if (this.links.length) return true
      if (!this.text.length) return false
      if (this.messageMode) return true
      if (this.longForm) return true
      if (this.overCharLimit()) return false
      return true
    },
    getReplyUserTags() {
      // remove invalid tags and/or not p
      if (!this.event || !this.event.tags) return []
      let usableTags = this.event.tags.filter(
        ([t, v]) => (t === 'p') && v
      ).map(([...values]) => { return [...values] })

      // add last 9 pubkeys mentioned
      let pubkeys = usableTags.filter(([t, v]) => t === 'p').map(([_, v]) => v).slice(0, 9)
      // plus the author of the note being replied to, if not present already
      if (!pubkeys.find((pubkey) => pubkey === this.event.pubkey)) {
        pubkeys.push(this.event.pubkey)
      }
      // remove ourselves
      pubkeys = pubkeys.filter((pubkey) => pubkey !== this.$store.state.keys.pub)
      return pubkeys
    },
    removeReplyUserTag(pubkey) {
      let mentions = this.mentions()
      Object.keys(mentions).forEach((key) => {
        let mention = mentions[key]
        if (mention.tag[1] === pubkey) {
          let range = new Range()
          range.setStart(mention.el, mention.pos)
          range.setEnd(mention.el, mention.pos + mention.length)
          this.insertText('', range)
          this.updateText()
        }
      })
      let tagIdx = Object.keys(this.tags).find((k) => pubkey === this.tags[k][1])
      delete this.tags[tagIdx]
      this.replyUserTags = this.replyUserTags.filter((pk) => pubkey !== pk)
    }
  }
}
</script>

<style lang='scss' scoped>
ul, li {
  padding: 0;
  margin: 0;
}
.post-entry-form {
  overflow: visible;
  display: flex;
  flex-direction: column;
}
.avatar-image {
  position: absolute;
  opacity: .4;
  pointer-events: none;
  top: -.2rem;
}

.char-left-label {
}
.over-limit {
  font-size: .9rem;
  line-height: .8rem;
  color: $negative;
}
.toolbox {
}
.button-image,
.button-emoji,
.button-link,
.button-close {
  opacity: .6;
}
.button-image:hover,
.button-emoji:hover,
.button-link:hover,
.button-close:hover {
  opacity: 1;
}


.input-area {
  position: relative;
  overflow-y: auto;
  font-size: 1rem;
  outline: none;
  border: none;
  display: block;
  margin: .3rem 0 0;
}
.input-area::-webkit-scrollbar {
  width: 0px;
}
.input-area #input-placeholder {
  position: absolute;
  pointer-events: none;
  opacity: .5;
  outline: none;
  border: none;
}
.input-area #input-editable,
.input-area #input-readonly,
.input-area #input-readonly-highlight {
  outline: none;
  border: none;
  min-height: 3rem;
  width: 100%;
  word-wrap: break-word;
  word-break: break-word;
}
.input-area #input-editable {
  display: block;
  opacity: .99;
  cursor: text;
}
.input-area #input-readonly {
  position: absolute;
  top: 0;
  left: 0;
  z-index: 3;
  color: transparent;
  background: transparent;
  pointer-events: none;
}
.input-area #input-readonly-highlight {
  position: absolute;
  top: 0;
  left: 0;
  color: transparent;
  background: transparent;
  pointer-events: none;
}
.q-tab-panel {
  background: var(--q-background);
}
</style>

<style lang='scss'>
#tribute-wrapper ul {
  list-style-type: none;
}
#tribute-wrapper .tribute-container {
  width: 100%;
}
#tribute-wrapper .tribute-container .highlight {
  background: rgba(0, 0, 0, 0.1);
}
.body--dark #tribute-wrapper .tribute-container .highlight {
  background: rgba(255, 255, 255, 0.1);
}

</style>


