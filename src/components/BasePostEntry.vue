<template>
  <div unelevated class='q-pa-none post-entry-form flex coloumn' @click.stop>
          <!-- <q-separator color='primary' size='1px'/> -->

    <div
      v-if='replyMode === "quote" || replyMode === "repost"'
      class='reposts flex column q-my-sm q-mr-sm q-pa-sm'
      :clickable='false'
    >
      <BasePost
        :event='event'
        :clickable='false'
        :is-embeded='true'
      />
    </div>
    <div
      v-if='messageMode === "reply" && event'
      :clickable='false'
      class='embeded-message q-px-sm q-py-xs'
    >
      <div class='relative-position'>
        <!-- <span class='text-primary text-subtitle1'> reply to </span> -->
        <q-btn icon="close" flat dense @click.stop='$emit("clear-event")' size='xs' class='absolute-top-right z-top'/>
      </div>
      <BaseMessage
        v-if='event'
        :event='event'
        :clickable='false'
        :is-embeded='true'
      />
    </div>
    <!-- <q-list id='tribute-wrapper' class='overflow-auto' style='position: aboslute; bottom: 100%; max-height: 70vh;'> -->
    <q-list id='tribute-wrapper' class='overflow-auto flex row z-top' style='max-height: 70vh' @click.stop>
    </q-list>
    <q-list v-if='Object.keys(mentions).length && !sending && focus'>
      <div class='text-bold text-caption'>tags<span v-if='$route.name === "messages"'>{{' **NOTE TAGS ARE NOT PRIVATE**'}}</span></div>
      <div v-for='(mention, index) in mentions' :key='index' class='flex row no-wrap'>
        {{ "#[" + mention.index + "] "+ (mention.tag[0] === "e" ? " event: " : "") + (mention.tag[0] === "p" ? " profile: " : "")}}
        <BaseUserName v-if='mention.tag[0] === "p"' :pubkey='mention.tag[1]' :fallback='true'/>
        <BaseMarkdown v-if='mention.tag[0] === "e"'> {{ `[&${shorten(mention.tag[1])}](/event/${mention.tag[1]})` }} </BaseMarkdown>
      </div>
    </q-list>
      <q-form
        v-show='replyMode !== "repost"'
        @submit="send"
        class='relative-position full-width'
        style='gap: 5px;'
      >
          <q-avatar round class='avatar-image' :clickable='false'>
            <img :src="$store.getters.avatar($store.state.keys.pub)" />
          </q-avatar>
          <div
            v-if='text'
            class='input-buttons absolute-top-right q-pt-sm z-top'
          >
            <BaseButtonCopy :button-text='text' button-class='text-primary'/>
            <BaseButtonClear :button-text='text' button-class='text-primary' @clear='reset'/>
          </div>
          <div v-if='text && !messageMode' class='char-left-label absolute-bottom-right'>
            <span style='font-size: .6rem' :style='overCharLimit ? "color: #ff0000; font-size: 1rem;" : ""'>{{ 280 - text.length }}&nbsp;char left</span>
          </div>
          <q-input
            ref="input"
            v-model="text"
            type='textarea'
            filled
            autogrow
            autofocus
            :label="label"
            :disable='sending'
            :loading='mentionsUpdating'
            @update='updateCursorPosition'
            @keypress.ctrl.enter="send"
            @keyup='updateCursorPosition'
            @keydown='updateCursorPosition'
            @delete='updateCursorPosition'
            @click='updateCursorPosition'
            @focus='focus = true'
            @blur='focus = false'
          >
            <template #loading>
              <div class='row justify-center q-my-md'>
                <q-spinner-orbit color="accent" size='md'/>
              </div>
            </template>
          </q-input>
          <q-separator color='primary' size='1px'/>
      </q-form>
        <div class='flex justify-between' :class='toolSelecting ? "column" : "row"'>
          <div class='flex row justify-between'>
          <q-btn-toggle
            v-model='toolSelected'
            class='flex'
            dense
            toggle-color=''
            toggle-text-color='accent'
            :class='toolSelecting ? "column q-pa-xs" : "row"'
            :options="[
              {value: 'emoji', slot: 'emoji'},
              {value: 'image', slot: 'image'},
              ]"
          >
          <template #emoji>
            <q-btn
              v-show='replyMode !== "repost"'
              unelevated
              class='no-padding button-emoji'
              dense
              size='sm'
              @click.stop='toggleTool("emoji")'
            >
              <q-icon>
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24"><path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0m0 22C6.486 22 2 17.514 2 12S6.486 2 12 2s10 4.486 10 10-4.486 10-10 10"/><path d="M8 7a2 2 0 1 0-.001 3.999A2 2 0 0 0 8 7M16 7a2 2 0 1 0-.001 3.999A2 2 0 0 0 16 7M15.232 15c-.693 1.195-1.87 2-3.349 2-1.477 0-2.655-.805-3.347-2H15m3-2H6a6 6 0 1 0 12 0"/></svg>
              </q-icon>
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
            <q-item v-if='toolSelecting' class='col toolbox q-px-none' ref='toolbox'>
              <q-separator vertical color='accent' size='1px'/>
              <BaseEmojiPicker
                v-if='emojiSelecting'
                :emoji-selecting='emojiSelecting'
                @emoji-selecting='emojiSelecting = !emojiSelecting'
                @emoji-selected='insertEmoji'
                :per-line='emojiPerRow'
                class='full-width'
              />
            </q-item>
          </div>
          <q-btn-group class='flex' unelevated>
          <q-btn
            v-if='toolSelecting'
            icon="close"
            unelevated
            class='col button-close'
            dense
            @click.stop='closeTools'
          >
        </q-btn>
          <q-btn
            flat
            unelevated
            color="primary"
            type="submit"
            @click='send'
            :disable='!textValid'
          >
            <!-- <q-item-label v-if='!replyMode'>relay&nbsp;</q-item-label> -->
            <q-icon name="send" :style='"transform: translateX(" + sendIconTranslation + "px);"'/>
          </q-btn>
          </q-btn-group>
        </div>
  </div>
</template>

<script>
import helpersMixin from '../utils/mixin'
// import {getPubKeyTagWithRelay, getEventTagWithRelay, processMentions} from '../utils/helpers'
import {getPubKeyTagWithRelay, getEventTagWithRelay, extractMentions} from '../utils/helpers'
import BaseButtonCopy from 'components/BaseButtonCopy.vue'
import BaseButtonClear from 'components/BaseButtonClear.vue'
import BaseEmojiPicker from 'components/BaseEmojiPicker.vue'
import BaseMarkdown from 'components/BaseMarkdown.vue'
import BaseMessage from 'components/BaseMessage.vue'

export default {
  name: 'BasePostEntry',
  mixins: [helpersMixin],
  emits: ['sent', 'resized', 'clear-event'],
  props: {
    // postEntryAlignment (post-entry-alignment) should be 'column' or 'row'
    // postEntryAlignment: {
    //   type: String,
    //   required: false,
    //   default: 'column'
    // },
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
    }
  },
  components: {
    BaseButtonCopy,
    BaseButtonClear,
    BaseEmojiPicker,
    BaseMarkdown,
    BaseMessage,
  },

  data() {
    return {
      text: '',
      cursorPosition: 0,
      sending: false,
      // emojiSelecting: false,
      toolSelected: '',
      // showSendIcon: true,
      sendIconTranslation: 0,
      // tributeList: [],
      tags: [],
      focus,
      mentionsUpdating: false,
      focusInput() {
        this.$refs.input.focus()
      },
    }
  },

  watch: {
    'replyMode'(curr, prev) {
      if (this.replyMode && curr !== prev) {
        this.$emit('resized')
        setTimeout(async () => {
          await this.$nextTick()
          this.focusInput()
        }, 20)
      }
    },
    'messageMode'(curr, prev) {
      if (this.messageMode && curr !== prev) {
        // this.focusInput()
        // await this.$nextTick()
        setTimeout(async () => {
          await this.$nextTick()
          this.focusInput()
        }, 20)
      }
    },
  },

  computed: {
    textarea() {
      return this.$refs.input.$el.querySelector('textarea')
    },
    profileMentionsProvider() {
      return this.createMentionsProvider()
    },
    overCharLimit() {
      // if (this.messageMode) false
      return 280 - this.text.length < 0
    },
    textValid() {
      if (this.replyMode === 'repost') return true
      if (!this.text.length) return false
      if (this.messageMode) return true
      if (this.overCharLimit) return false
      return true
    },
    inputWidth() {
      return this.$refs.input?.$el?.clientWidth
    },
    emojiSelecting() {
      if (this.toolSelected === 'emoji') return true
      return false
    },
    imageSelecting() {
      if (this.toolSelected === 'image') return true
      return false
    },
    toolSelecting() {
      if (this.emojiSelecting || this.imageSelecting) return true
      return false
    },
    toolboxWidth() {
      if (this.toolSelecting) return this.$refs.toolbox?.$el?.clientWidth
      return 0
    },
    emojiPerRow() {
      if (this.toolboxWidth) return Math.floor((this.toolboxWidth - 10) / 25)
      return 0
    },
    label() {
      if (this.messageMode === 'reply') return 'reply to message'
      else if (this.messageMode) return ''
      else if (this.replyMode) {
        if (this.replyMode === 'reply') return "what's your reply?"
        else if (this.replyMode === 'quote') return "what's your reply to this quote?"
      }
      return "what's happening?"
    },
    mentions() {
      if (this.text.length === 0) return []
      const mentionAnchorRegex = /#\[(?<i>\d+)\]/g
      let matches = this.text.matchAll(mentionAnchorRegex)
      let mentions = {}
      for (let match of matches) {
        if (this.tags[match.groups.i]) mentions[match.groups.i + '_' + match.index] = {
          index: match.groups.i,
          tag: this.tags[match.groups.i],
          position: match.index + 2,
          length: match.groups.i.length,
        }
      }
      return mentions
    },
    hashtags() {
      if (this.text.length === 0) return []
      const hashtagRegex = /#(?<i>[\w]{1,63})/g
      let matches = this.text.matchAll(hashtagRegex)
      let hashtags = []
      for (let match of matches) {
        console.log('match', match)
        hashtags.push(match.groups.i.toLowerCase())
      }
      return hashtags
    },
  },

  mounted() {
    this.profileMentionsProvider.attach(this.textarea)
  },

  beforeUnmount() {
    this.profileMentionsProvider.detach(this.textarea)
  },

  methods: {
    async send() {
      if (!this.textValid) {
        console.log('text not valid')
        return
      }
      if (this.sending) {
        console.log('send already in progress')
        return
      }
      this.cursorPosition = 0
      this.toolSelected = ''
      this.sending = true
      this.animateSendIcon()
      this.text = await extractMentions(this.text, this.tags)
      // make sure mentions are sequential
      if (Object.keys(this.mentions).length &&
        Math.max(...Object.keys(this.mentions).map(key => key.split('_')[0])) >
        this.tags.filter(tag => tag.length >= 2).filter((v, i, a) => a.indexOf(v) === i).length) {
        // save copy of mentions and remove for now
        let mentions = Object.assign({}, this.mentions)
        this.tags = []
        let offset = 0
        console.log('fyi having to clean up too many mentions')
        // now add back mentions
        for (let index in mentions) {
          let mention = mentions[index]
          let idx = this.tags.findIndex(([t, v]) => t === mention.tag[0] && v === mention.tag[1])
          // console.log('idx', idx)
          if (idx === -1) {
            this.tags.push(mention.tag)
            idx = this.tags.length - 1
          }
          this.text = this.text.slice(0, mention.position + offset) + idx + this.text.slice(mention.position + offset + mention.length)
          if (mention.length !== String(idx).length) offset = String(idx).length - mention.length
        }
      // }
      }
      let event
      if (this.replyMode) event = await this.sendReply()
      else if (this.messageMode) event = await this.sendMessage()
      else event = await this.sendPost()
      if (event) {
        this.interpolateEventMentions(event)
        this.reset()
        this.$emit('sent', event)
        if (this.messageMode) this.$emit('clear-event')
        if (!this.replyMode && !this.messageMode) this.toEvent(event.id)
      }
      this.sending = false
    },

    async sendPost() {
      this.appendHashtags()
      let tags = this.tags.map(([...v]) => [...v])
      // console.log('tags sendPost:', tags)
      let event = await this.$store.dispatch('sendPost', {message: this.text, tags: tags})
      if (event) {
        return event
      }
    },

    async sendReply() {
      // build tags
      // let tags = []
      if (this.replyMode === 'repost' && this.text) this.text = ''

      // save copy of mentions and remove for now
      let mentions = Object.assign({}, this.mentions)
      this.tags = []

      // remove invalid tags and/or not p/e
      let usableTags = this.event.tags.filter(
        ([t, v]) => (t === 'p' || t === 'e') && v
      ).map(([t, v]) => { return [t, v] })
        // console.log('usableTags: ', usableTags)

      // add last 4 pubkeys mentioned
      let pubkeys = usableTags.filter(([t, v]) => t === 'p').map(([_, v]) => v)
      // console.log('pubkeys: ', pubkeys)
      for (let i = 0; i < Math.min(4, pubkeys.length); i++) {
        this.tags.push(await getPubKeyTagWithRelay(pubkeys[pubkeys.length - 1 - i]))
      }
        // console.log('tags: ', tags)
      // plus the author of the note being replied to, if not present already
      if (!this.tags.find(([_, v]) => v === this.event.pubkey)) {
        this.tags.push(await getPubKeyTagWithRelay(this.event.pubkey))
      }
        // console.log('tags: ', tags)
      if (this.replyMode === 'quote' || this.replyMode === 'repost') {
        // if quote or repost, only tag this event and add mention to text
        let last = getEventTagWithRelay(this.event)
        this.tags.push(last)
        this.text += ` #[${this.tags.length - 1}]`
      } else {
        // add the first and the last event ids
        let first = usableTags.find(([t, v]) => t === 'e')
        if (first) this.tags.push(first)
        let last = getEventTagWithRelay(this.event)
        this.tags.push(last)
      }
        // console.log('tags: ', tags)

      // remove ourselves
      this.tags = this.tags.filter(([_, v]) => v !== this.$store.state.keys.pub)

      // add mentions
      if (Object.keys(mentions).length) {
        let offset = 0
        for (let index in mentions) {
          let mention = mentions[index]
          let idx = this.tags.findIndex(([t, v]) => t === mention.tag[0] && v === mention.tag[1])
          // console.log('idx', idx)
          if (idx === -1) {
            this.tags.push(mention.tag)
            idx = this.tags.length - 1
          }
          this.text = this.text.slice(0, mention.position + offset) + idx + this.text.slice(mention.position + offset + mention.length)
          if (mention.length !== String(idx).length) offset = String(idx).length - mention.length
        }
      }
      this.appendHashtags()
      let tags = this.tags.map(([...v]) => [...v])
      // let tags = this.tags.map((tag) => {
      //   if (tag.length >= 3) return [tag[0], tag[1], tag[2]]
      //   else return [tag[0], tag[1]]
      // })
            // console.log('text: ', this.text)
      // tags.push(...this.hashtags)
            // console.log('tags: ', tags)
      // console.log('event', event)
      return await this.$store.dispatch('sendPost', {
        message: this.text,
        tags: tags
      })
      // 07e4f77f3f1c8342f4627381832c4b796d7795e2355e5bba5eef672ee65e1d20
    },

  async sendMessage() {
    let now = Math.round(Date.now() / 1000)
    // add the pubkey of the person we are messaging
    if (!this.tags.find(([_, v]) => v === this.$route.params.pubkey)) {
        this.tags.push(['p', this.$route.params.pubkey])
    }
    if (this.event && !this.tags.find(([_, v]) => v === this.event.id)) {
        this.tags.push(['e', this.event.id])
    }
    // this.tags = this.tags.filter(([_, v]) => v !== this.$store.state.keys.pub)
    return await this.$store.dispatch('sendChatMessage', {
      now: now,
      pubkey: this.$route.params.pubkey,
      text: this.text,
      tags: this.tags
    })
  },

    async updateCursorPosition() {
      // console.log('mentions', this.mentions)
      // console.log('tags', this.tags)
      const mentionRegex = /(?<t>[@&]{1})(?<p>[a-f0-9]{64})/g
      if (this.text.match(mentionRegex)) {
        this.mentionsUpdating = true
        this.text = await extractMentions(this.text, this.tags)
        this.mentionsUpdating = false
      }
      // let interpolated = this.interpolateMentions(this.text, this.tags)
      // this.tags = interpolated.
      let cursorPos = this.$refs.input.$el.querySelector('textarea').selectionStart
       if (cursorPos) {
          this.cursorPosition = cursorPos
      }
      //  const mentionAnchorRegex = /#\[/g
      //  const mentionAnchorRegex = /#\[(\d+)\]/g
      // let matches = this.text.matchAll(mentionAnchorRegex)
      // let mentions = {}
      // for (let match in this.text.matchAll(mentionAnchorRegex)) {
      //   console.log('match', match)
        // mentions[match.group.i] = this.tags[match.group.i]
      // }
    },

    insertEmoji(emoji) {
      this.text = this.text.slice(0, this.cursorPosition) + emoji.native + this.text.slice(this.cursorPosition)
      this.cursorPosition += emoji.native.length
      // this.cursorPosition++
    },

    animateSendIcon() {
      let interval = setInterval(() => {
        if (!this.sending) {
          clearInterval(interval)
          this.sendIconTranslation = 0
          // this.showSendIcon = true
          return
        }
        this.sendIconTranslation += 3
        if (this.sendIconTranslation > 50) this.sendIconTranslation -= (this.inputWidth + 40)
        // this.showSendIcon = !this.showSendIcon
      }, 50)
    },

    closeTools() {
      this.toolSelected = ''
    },

    toggleTool(tool) {
      if (this.toolSelected === tool) this.closeTools()
      else this.toolSelected = tool
    },

    reset() {
      this.closeTools()
      this.text = ''
      this.tags = []
    },

    upshiftTags(tags) {
      if (this.tags.length === 0) this.tags.concat(tags)
    },

    appendHashtags() {
      for (let hashtag of this.hashtags) {
        if (!this.tags.find(([_, v]) => v === hashtag)) {
          this.tags.push(['hashtag', hashtag])
        }
      }
    },
  }
}
</script>

<style lang='scss' scoped>
.post-entry-form {
  overflow: visible;
  display: flex;
  flex-direction: column;
  gap: .1rem;
  padding: 0;
}
.avatar-image {
  position: absolute;
  margin: .25rem;
  opacity: .5;
}
.char-left-label {
}
.toolbox {
}
.button-image,
.button-emoji,
.button-close {
  opacity: .6;
}
.button-image:hover,
.button-emoji:hover,
.button-close:hover {
  opacity: 1;
}
</style>

<style lang='scss'>
ul {
  list-style-type: none;
}
</style>
