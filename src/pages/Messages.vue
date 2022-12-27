<template>
  <q-page class='flex column no-wrap' style='min-height: unset;'>
    <div id='header-placeholder' />
    <div id='header' ref='header'>
      <div class='flex row justify-evenly no-wrap full-width q-pt-sm q-px-sm'>
        <BaseUserCard
          v-if='hexPubkey'
          :pubkey='hexPubkey'
          :action-buttons='false'
          style='width: 50%;'
        />
        <BaseUserCard
          v-if='$store.state.keys.pub'
          :pubkey='$store.state.keys.pub'
          :action-buttons='false'
          :align-right='true'
          style='width: 50%; self-justify: end;'
        />
      </div>
      <q-separator color='accent' size='1px' spaced/>
      <div class='relative-position'>
        <div class='absolute-top flex justify-center'>
          <span
              class='text-accent z-top q-px-sm'
              style=''
              id='current-datestamp'
            >
              {{ currentDatestamp }}
            </span>
          </div>
      </div>
    </div>
    <div ref='messageScroll' id='message-scroll' @scroll='updateCurrentDatestamp' @touchmove='updateCurrentDatestamp' @touchend='delayedUpdateCurrentDatestamp'>
      <q-infinite-scroll @load="loadMore" reverse ref='messagesScroll'>
        <div
          v-for="(event, index) in messagesGrouped"
          :key="event.id + '_' + event.taggedEvents?.length"
          class='flex column items-self'
        >
          <div
            v-if='index === 0 || dateUTC(messages[index].created_at) !== dateUTC(messages[index - 1].created_at)'
            class='self-center text-accent datestamp'
            :class='index === 0 ? "q-pb-sm" : "q-py-sm"'
          >
            {{dateUTC(event.created_at)}}
          </div>
          <BaseMessage
            :id="event.id"
            :event="event"
            v-scroll-fire='markAsRead'
            @mounted='scrollToBottom'
            @reply='reply'
          />
        </div>
        <template #loading>
          <div v-if='canLoadMore' class='row justify-center q-my-md'>
            <q-spinner-orbit color="accent" size='md'/>
          </div>
        </template>
        <div style='height: .5rem;' />
      </q-infinite-scroll>
    </div>
    <div class='full-width relative-position q-pt-xs'>
      <q-btn
        v-if='unreadMessagesSet.size'
        :label="unreadMessagesSet.size + ' unread'"
        icon-right="mail_lock"
        color="secondary"
        class='q-ma-sm unread-messages-button'
        outline
        size='sm'
        @click.stop='scrollToBottom()'
      />
      <div class='gt-xs'>
      <q-separator color='accent' size='1px' />
      <BasePostEntry
            :message-mode='messageMode'
            :event='replyEvent'
            @clear-event='replyEvent=null'
            @sent='addSentMessage'
            class='q-px-md q-pt-sm'
          />
      </div>
    </div>
  </q-page>
</template>

<script>
import helpersMixin from '../utils/mixin'
import { dbUserProfile, streamUserProfile, dbMessages, listenMessages } from '../query'
import BaseMessage from 'components/BaseMessage.vue'
import { useQuasar } from 'quasar'
import { createMetaMixin } from 'quasar'
import {metadataFromEvent} from '../utils/event'

const metaData = {
  // sets document title
  title: 'astral - messages',

  // meta tags
  meta: {
    description: { name: 'description', content: `Nostr messages with ${window.location.pathname.split('/')[2]}` },
    keywords: { name: 'keywords', content: 'nostr decentralized social media' },
    equiv: { 'http-equiv': 'Content-Type', content: 'text/html; charset=UTF-8' },
  },
}


export default {
  name: 'Messages',
  mixins: [helpersMixin, createMetaMixin(metaData)],
  emits: ['reply-event', 'scroll-to-rect'],
  components: {
    BaseMessage,
  },

  setup () {
    const $q = useQuasar()
    return $q
  },

  data() {
    return {
      sub: {},
      messages: [],
      canLoadMore: true,
      text: '',
      messagesSet: new Set(),
      unreadMessagesSet: new Set(),
      unlock: () => {},
      mutex: null,
      replyEvent: null,
      currentDatestamp: null,
    }
  },

  computed: {
    messageMode() {
      if (this.$route.name === 'messages') {
        if (this.replyEvent) return 'reply'
        else return 'message'
      } else return null
    },
    hexPubkey() {
      if (this.$route.params.pubkey) return this.bech32ToHex(this.$route.params.pubkey)
      return ''
    },
    messagesGrouped() {
      let grouped = this.messages
        .reduce((acc, ev) => {
          let event = Object.assign({}, ev)
          if (!acc.length) return [event]
          let last = acc[acc.length - 1]
          if (
            last.pubkey === event.pubkey &&
            last.created_at + 120 >= event.created_at
          ) {
            last.appended = last.appended || []
            last.appended.push(event)
          } else {
            acc.push(event)
          }
          return acc
        }, [])
      return grouped
    }
  },

  async activated() {
    // load saved messages and start listening for new ones
    await this.start()
    this.scrollToBottom()
    this.resizeHeaderPlaceholder()
  },

  async deactivated() {
    if (this.sub.listenMessages) this.sub.listenMessages.cancel()
    if (this.sub.streamUserProfile) this.sub.streamUserProfile.cancel()
  },

  methods: {
    async lock() {
      if (this.mutex) {
        await this.mutex
      }

      this.mutex = new Promise(resolve => {
        this.unlock = resolve
      })
    },

    async start() {
      // load peer profile if it exists
      let profile = await dbUserProfile(this.hexPubkey)
      if (profile) {
        let metadata = metadataFromEvent(profile)
        this.$store.commit('addProfileToCache', metadata)
        this.$store.dispatch('useNip05', {metadata})
      }
      this.sub.streamUserProfile = await streamUserProfile(this.hexPubkey, async event => {
        let metadata = metadataFromEvent(event)
        this.$store.commit('addProfileToCache', metadata)
        this.$store.dispatch('useNip05', {metadata})
      })

      // listen for new messages
      this.sub.listenMessages = await listenMessages(async event => {
        let eventUserTags = event.tags
            .filter(([t, v]) => t === 'p' && v)
            .map(([_, v]) => v)
        if ((event.pubkey === this.hexPubkey && eventUserTags.includes(this.$store.state.keys.pub)) ||
          (event.pubkey === this.$store.state.keys.pub && eventUserTags.includes(this.hexPubkey))
        )
          this.addMessage(event)
      })

      // commit to reading messages
      this.$store.commit('haveReadMessage', this.hexPubkey)
    },


    async scrollToBottom() {
      return new Promise(resolve =>
        setTimeout(() => {
          this.$refs.messageScroll.scrollTop = this.$refs.messageScroll.scrollHeight
          this.$emit('scroll-to-rect', { top: this.$refs.messageScroll.scrollHeight })
          this.$store.commit('haveReadMessage', this.hexPubkey)
          this.unreadMessagesSet.clear()
          resolve()
        }, 100)
      )
    },

    async loadMore(_, done) {
      let loadedMessages = await dbMessages(
        this.$store.state.keys.pub,
        this.hexPubkey,
        50,
        this.messages[0]?.created_at - 1 || Math.round(Date.now() / 1000)
      )

      if (loadedMessages.length < 50) {
        this.canLoadMore = false
      }

      let loadedMessagesFiltered = await this.processMessages(loadedMessages)
      this.messages = loadedMessagesFiltered.concat(this.messages)
      this.messages.sort((p, c) => p.created_at - c.created_at)
      done(!this.canLoadMore)
    },

    async processMessages(messages) {
      let messagesFiltered = []
      for (let i = 0; i < messages.length; i++) {
        let event = messages[i]
        if (this.messagesSet.has(event.id)) continue

        this.messagesSet.add(event.id)
        await this.lock()
        event.text = await this.getPlaintext(event)
        this.unlock()
        this.interpolateMessageMentions(event)
        messagesFiltered.push(event)
      }
      return messagesFiltered
    },

    markAsRead(element) {
      if (this.unreadMessagesSet.size === 0) return
      if (!this.unreadMessagesSet.has(element.id)) return
      this.unreadMessagesSet.delete(element.id)
      if (this.unreadMessagesSet.size === 0) {
        this.$store.commit('haveReadMessage', this.hexPubkey)
      }
    },

    reply(event) {
      this.replyEvent = null
      setTimeout(() => {
        let replyEvent = Object.assign({}, event)
        replyEvent.appended = []
        this.replyEvent = replyEvent
        this.$emit('reply-event', this.replyEvent)
      }, 20)
    },

    updateCurrentDatestamp(event) {
      let messageScroll = this.$refs.messageScroll
      let datestamps = Array.from(messageScroll.querySelectorAll('.datestamp'))
      let headerHeight = document.querySelector('#header').clientHeight
      let currentDatestamp = datestamps.reduce((p, c) => {
        let rect = c.getBoundingClientRect()
        if (rect.top < headerHeight && c.offsetTop > p.offsetTop) {
          return c
        } else return p
      }, datestamps[0])
      this.currentDatestamp = currentDatestamp.innerText
    },

    delayedUpdateCurrentDatestamp(event) {
      let count = 0
      let interval = setInterval(() => {
        this.updateCurrentDatestamp()
        count++
        if (count > 9) clearInterval(interval)
      }, 100)
      // setTimeout(() => { this.updateCurrentDatestamp() }, 1000)
    },

    async addMessage(ev) {
      let messageScroll = this.$refs.messageScroll
      let scrollToBottom = 100 > Math.abs((messageScroll.scrollHeight - messageScroll.clientHeight) - messageScroll.scrollTop) ||
        messageScroll.scrollHeight === messageScroll.clientHeight
      let events = await this.processMessages([ev])
      if (!events.length) return
      let event = events[0]
      this.messages.push(event)
      this.messages.sort((p, c) => p.created_at - c.created_at)
      if (scrollToBottom) {
        this.$store.commit('haveReadMessage', this.hexPubkey)
        this.scrollToBottom()
      } else if (event.pubkey === this.hexPubkey) {
          this.unreadMessagesSet.add(event.id)
      }
    },

    addSentMessage(event) {
      this.addMessage(event)
      this.replyEvent = null
    },

    resizeHeaderPlaceholder() {
      setTimeout(() => {
        document.querySelector('#header-placeholder').style.minHeight = `${document.querySelector('#header').clientHeight}px`
      }, 1000)
    },
  }
}
</script>

<style lang='css' scoped>
#header {
  position: fixed;
  top: 0;
  z-index: 1;
  width: calc(100vw - 2px);
  left: 1px;
  background: var(--q-background);
}
#current-datestamp {
  border-bottom-right-radius: .25rem;
  border-bottom-left-radius: .25rem;
  background: var(--q-background);
}
.unread-messages-button{
  position: absolute;
  top: -2.5rem;
  left: .3rem;
  background: var(--q-background) !important;
}
  #message-scroll {
    padding: 0 .3rem;
  }
@media screen and (min-width: 600px) {
  .q-page {
    height: inherit;
    overflow: hidden;

  }
  #header-placeholder {
    display: none;
  }
  #header {
    position: unset;
    top: unset;
    width: unset;
    z-index: unset;
    background: unset;
    left: unset;
  }
  #message-scroll {
    overflow: auto;
    height: 100%;
    padding: 0 .3rem;
  }
}
</style>
