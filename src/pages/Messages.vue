<template>
  <q-page class='flex column no-wrap' style='min-height: unset;'>
    <div id='header-placeholder' />
    <div id='header' ref='header'>
      <div class='flex row justify-evenly no-wrap full-width q-pt-sm q-px-sm'>
        <BaseUserCard
          v-if='$route.params.pubkey'
          :pubkey='$route.params.pubkey'
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
      <q-separator color='accent' size='2px' spaced/>
      <div class='relative-position'>
        <div class='absolute-top flex justify-center'>
          <span
              class='text-accent bg-dark z-top q-px-sm'
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
          v-for="(event, index) in messages"
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
    </div>
  </q-page>
</template>

<script>
import helpersMixin from '../utils/mixin'
import {dbMessages, streamMessages} from '../query'
import BaseMessage from 'components/BaseMessage.vue'
import { useQuasar } from 'quasar'

export default {
  name: 'Messages',
  mixins: [helpersMixin],
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
      sub: null,
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

  async activated() {
    // load saved messages and start listening for new ones
    await this.start()
    this.scrollToBottom()
    this.resizeHeaderPlaceholder()
  },

  async deactivated() {
    if (this.sub) {
      this.sub.cancel()
      this.sub = null
    }
    this.$store.dispatch('cancelUseProfile', {pubkey: this.$route.params.pubkey})
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
      // this.messagesSet = new Set()
      if (this.sub) this.sub.cancel()

      // load peer profile if it exists
      this.$store.dispatch('useProfile', {pubkey: this.$route.params.pubkey})

      if (this.$store.state.unreadMessages[this.$route.params.pubkey]) {
        let newMessages = await dbMessages(
          this.$store.state.keys.pub,
          this.$route.params.pubkey,
          this.$store.state.unreadMessages[this.$route.params.pubkey]
        )
        let newMessagesFiltered = await this.processMessages(newMessages)
        this.messages.push(...newMessagesFiltered)
      }
      this.$store.commit('haveReadMessage', this.$route.params.pubkey)
      // this.$store.dispatch('useProfile', {pubkey: this.$route.params.pubkey, request: true})
      this.sub = await streamMessages(async event => {
        let eventUserTags = event.tags
            .filter(([t, v]) => t === 'p' && v)
            .map(([_, v]) => v)
        if ((event.pubkey === this.$route.params.pubkey && eventUserTags.includes(this.$store.state.keys.pub)) ||
          (event.pubkey === this.$store.state.keys.pub && eventUserTags.includes(this.$route.params.pubkey))
        )
          this.addMessage(event)
      })

      // this.updateCurrentDatestamp()
    },


    async scrollToBottom() {
      return new Promise(resolve =>
        setTimeout(() => {
          this.$refs.messageScroll.scrollTop = this.$refs.messageScroll.scrollHeight
          this.$emit('scroll-to-rect', { top: this.$refs.messageScroll.scrollHeight })
          this.$store.commit('haveReadMessage', this.$route.params.pubkey)
          this.unreadMessagesSet.clear()
          resolve()
        }, 100)
      )
    },

    async loadMore(_, done) {
      let loadedMessages = await dbMessages(
        this.$store.state.keys.pub,
        this.$route.params.pubkey,
        50,
        this.messages[0]?.created_at - 1 || Math.round(Date.now() / 1000)
      )
      // console.log('loadedMessages', loadedMessages)

      if (loadedMessages.length < 50) {
        this.canLoadMore = false
      }

      // newMessages = newMessages.filter(event => !this.messagesSet.has(event.id))
      let loadedMessagesFiltered = await this.processMessages(loadedMessages)

      this.messages = loadedMessagesFiltered.concat(this.messages)
      done(!this.canLoadMore)
    },

    async processMessages(messages) {
      let messagesFiltered = []
      for (let i = 0; i < messages.length; i++) {
      // await messages.forEach(async (event) => {
        let event = messages[i]
        if (this.messagesSet.has(event.id)) continue

        this.messagesSet.add(event.id)
        event.text = await this.getPlaintext(event)
        this.interpolateMessageMentions(event)
        if (event.appended) {
          for (let j = 0; j < event.appended.length; j++) {
            this.messagesSet.add(event.appended[j].id)
            event.appended[j].text = await this.getPlaintext(event.appended[j])
            this.interpolateMessageMentions(event.appended[j])
          }
        }
        messagesFiltered.push(event)
      }
      return messagesFiltered
    },

    markAsRead(element) {
      if (this.unreadMessagesSet.size === 0) return
      if (!this.unreadMessagesSet.has(element.id)) return
      this.unreadMessagesSet.delete(element.id)
      if (this.unreadMessagesSet.size === 0) {
        this.$store.commit('haveReadMessage', this.$route.params.pubkey)
      }
    },

    reply(event) {
      this.$emit('reply-event', event)
      this.replyEvent = null
      setTimeout(() => {
        let replyEvent = Object.assign({}, event)
        replyEvent.appended = []
        this.replyEvent = replyEvent
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

    // async messageSent(event) {
    //   await this.addMessage(event)
    //   this.replyEvent = null
    // },

    async addMessage(event) {
      if (this.messagesSet.has(event.id)) return
      this.messagesSet.add(event.id)

      await this.lock()
      event.text = await this.getPlaintext(event)
      this.unlock()
      this.interpolateMessageMentions(event)

      let messageScroll = this.$refs.messageScroll
      let scrollToBottom = 100 > Math.abs((messageScroll.scrollHeight - messageScroll.clientHeight) - messageScroll.scrollTop) ||
        messageScroll.scrollHeight === messageScroll.clientHeight

      if (this.messages.length === 0) {
        this.messages.push(event)
      } else {
        let last = this.messages[this.messages.length - 1]
        if (
          event.pubkey === this.$store.state.keys.pub &&
          last.pubkey === event.pubkey &&
          last.created_at + 120 >= event.created_at
        ) {
          last.appended = last.appended || []
          last.appended.push(event)
        } else {
          this.messages.push(event)
        }
      }

      if (scrollToBottom) {
        this.$store.commit('haveReadMessage', this.$route.params.pubkey)
        this.scrollToBottom()
      } else if (event.pubkey === this.$route.params.pubkey) {
        this.unreadMessagesSet.add(event.id)
      }
    },

    resizeHeaderPlaceholder() {
      setTimeout(() => {
        document.querySelector('#header-placeholder').style.minHeight = `${document.querySelector('#header').clientHeight}px`
      }, 1000)
    },
  }
}
</script>

<style lang='scss' scoped>
#header {
  position: fixed;
  top: 0;
  z-index: 1;
  background: $dark;
  width: calc(100vw - 4px);
  left: 2px;
}
#current-datestamp {
  border-bottom-right-radius: .25rem;
  border-bottom-left-radius: .25rem;
}
.unread-messages-button{
  position: absolute;
  top: -3rem;
  left: 0
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
  }
}
</style>
