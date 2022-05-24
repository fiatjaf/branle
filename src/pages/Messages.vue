<template>
  <q-page class='fit flex column no-wrap overflow-hidden'>
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
    <div ref='messageScroll' class='col overflow-auto' @scroll='updateCurrentDatestamp'>
      <q-infinite-scroll @load="loadMore" reverse>
        <!-- <q-intersection
          @visibility='test'
          > -->
        <div
          v-for="(event, index) in messages"
          :key="event.id"
          class='flex column items-self'
        >
          <div
            v-if='index === 0 || dateUTC(messages[index].created_at) !== dateUTC(messages[index - 1].created_at)'
            class='self-center text-accent datestamp'
            :class='index === 0 ? "q-pb-md" : "q-py-md"'
          >
            {{dateUTC(event.created_at)}}
          </div>
          <BaseMessage
            :id="event.id"
            :event="event"
            v-scroll-fire='markAsRead'
            @scroll-to='scrollToBottom'
            @reply='reply'
          />
        <!-- </q-intersection > -->
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
      <!-- <q-separator v-if='Object.keys(replyEvent).length' color='primary' size='1px'/> -->
      <BasePostEntry :message-mode='replyEvent? "reply" : "message"' :event='replyEvent' @clear-event='replyEvent=null'/>
    </div>
  </q-page>
</template>

<script>
import {decrypt} from 'nostr-tools/nip04'

import helpersMixin from '../utils/mixin'
// import {getElementFullHeight, isElementFullyScrolled} from '../utils/helpers'
// import {isElementFullyScrolled} from '../utils/helpers'
// import { scroll } from 'quasar'
// const { getVerticalScrollPosition, setVerticalScrollPosition} = scroll
// import {dbGetEvent} from '../db'
import {pool} from '../pool'
import {dbGetMessages, onNewMessage, dbGetEvent} from '../db'
import BaseMessage from 'components/BaseMessage.vue'

export default {
  name: 'Messages',
  mixins: [helpersMixin],

  components: {
    BaseMessage,
  },

  data() {
    return {
      listener: null,
      messages: [],
      canLoadMore: true,
      text: '',
      // sending: null,
      messagesSet: new Set(),
      unreadMessagesSet: new Set(),
      unlock: () => {},
      mutex: null,
      eventSubs: {},
      replyEvent: null,
      currentDatestamp: null,
    }
  },

  async activated() {
    // load peer profile if it exists
    this.$store.dispatch('useProfile', {pubkey: this.$route.params.pubkey})

    // load saved messages and start listening for new ones
    await this.start()
    this.scrollToBottom()
  },

  async deactivated() {
    if (this.listener) this.listener.cancel()
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
      this.messagesSet = new Set()
      if (this.listener) this.listener.cancel()

      this.$store.commit('haveReadMessage', this.$route.params.pubkey)
      this.$store.dispatch('useProfile', {pubkey: this.$route.params.pubkey})

      this.listener = onNewMessage(this.$route.params.pubkey, async event => {
        if (this.messagesSet.has(event.id)) return
        this.messagesSet.add(event.id)

        await this.lock()
        event.text = await this.getPlaintext(event)
        this.unlock()
        this.interpolateMessageMentions(event)
        if (event.tags.filter(([t, v]) => t === 'e' && v).length) this.processTaggedEvents(event)

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
      })
    },


    async scrollToBottom() {
      return new Promise(resolve =>
        setTimeout(() => {
          this.$refs.messageScroll.scrollTop = this.$refs.messageScroll.scrollHeight
          this.unreadMessagesSet.clear()
          resolve()
        }, 10)
      )
    },

    async loadMore(_, done) {
      let newMessages = await dbGetMessages(
        this.$route.params.pubkey,
        50,
        this.messages[0]?.created_at - 1 || ''
      )

      if (newMessages.length < 50) {
        this.canLoadMore = false
      }

      newMessages = newMessages.filter(event => !this.messagesSet.has(event.id))

      for (let i = 0; i < newMessages.length; i++) {
        this.messagesSet.add(newMessages[i].id)
        newMessages[i].text = await this.getPlaintext(newMessages[i])
        this.interpolateMessageMentions(newMessages[i])
        if (newMessages[i].tags.filter(([t, v]) => t === 'e' && v).length) this.processTaggedEvents(newMessages[i])
        if (newMessages[i].appended) {
          for (let j = 0; j < newMessages[i].appended.length; j++) {
            this.messagesSet.add(newMessages[i].appended[j].id)
            newMessages[i].appended[j].text = await this.getPlaintext(newMessages[i].appended[j])
            this.interpolateMessageMentions(newMessages[i].appended[j])
            if (newMessages[i].appended[j].tags.filter(([t, v]) => t === 'e' && v).length) this.processTaggedEvents(newMessages[i].appended[j])
          }
        }
      }

      if (newMessages.length === 0) {
        this.canLoadMore = false
      }

      this.messages = newMessages.concat(this.messages)
      done(!this.canLoadMore)
    },

    async getPlaintext(event) {
      if (
        event.tags.find(
          ([tag, value]) => tag === 'p' && value === this.$store.state.keys.pub
        )
      ) {
        // it is addressed to us
        // decrypt it
        return await this.decrypt(event.pubkey, event.content)
      } else if (event.pubkey === this.$store.state.keys.pub) {
        // it is coming from us
        let [_, target] = event.tags.find(([tag]) => tag === 'p')
        // decrypt it
        return await this.decrypt(target, event.content)
      }
    },

    async decrypt(peer, ciphertext) {
      try {
        if (this.$store.state.keys.priv) {
          return decrypt(this.$store.state.keys.priv, peer, ciphertext)
        } else if (
          (await window?.nostr?.getPublicKey?.()) === this.$store.state.keys.pub
        ) {
          return await window.nostr.nip04.decrypt(peer, ciphertext)
        } else {
          throw new Error('no private key available to decrypt!')
        }
      } catch (err) {
        return '???'
      }
    },

    markAsRead(element) {
      if (this.unreadMessagesSet.size === 0) return
      if (!this.unreadMessagesSet.has(element.id)) return
      this.unreadMessagesSet.delete(element.id)
      if (this.unreadMessagesSet.size === 0) {
        this.$store.commit('haveReadMessage', this.$route.params.pubkey)
      }
    },

    async processTaggedEvents(event) {
      let tagged = event.tags.filter(([t, v]) => t === 'e' && v).map(([t, v]) => v)
      // console.log('processing tagged events for: ', event, tagged)
      tagged.splice(10)
      event.taggedEvents = []
      this.listenReposts(tagged, event.taggedEvents)
    },

    async listenReposts(eventIds, events) {
      // let subEventIds = []
      // let this.events = []
      for (let eventId of eventIds) {
        let event = await dbGetEvent(eventId)
        if (event) {
          this.$store.dispatch('useProfile', {
            pubkey: event.pubkey,
            request: true
          })
          if (event.kind === 1 || event.kind === 2) this.interpolateEventMentions(event)
          else if (event.kind === 4) {
            event.text = await this.getPlaintext(event)
            this.interpolateMessageMentions(event)
          }
          events.push(event)
        // } else {
        //   subEventIds.push(eventId)
        } else this.eventSubs[eventId] = pool.sub(
          {
            filter: {ids: eventId},
            cb: async event => {
              this.eventSubs[eventId].unsub()
              this.$store.dispatch('useProfile', {
                pubkey: event.pubkey,
                request: true
              })
              if (event.kind === 1 || event.kind === 2) this.interpolateEventMentions(event)
              else if (event.kind === 4) {
                event.text = await this.getPlaintext(event)
                this.interpolateMessageMentions(event)
              }
              events.push(event)
              // this.event = event
            }
          },
          'event-browser'
        )
      }
      // console.log('this.events: ', this.events)
      // console.log('subEventIds: ', subEventIds)
    },

    reply(event) {
      this.replyEvent = null
      setTimeout(() => {
        let replyEvent = Object.assign({}, event)
        replyEvent.appended = []
        this.replyEvent = replyEvent
      }, 20)
    },

    updateCurrentDatestamp(event) {
      // console.log('scrolled', event)
      let messageScroll = this.$refs.messageScroll
      let datestamps = Array.from(messageScroll.querySelectorAll('.datestamp'))
      // let inView = (messageScroll.scrollTop < )
      // console.log('datestamps', datestamps)
//       console.log('datestamps', datestamps.map((node) => {
//  return {
//         offsetHeight: node.offsetHeight,
//         offsetTop: node.offsetTop,
//         inView: (messageScroll.scrollTop < node.offsetTop && messageScroll.scrollTop + messageScroll.clientHeight > node.offsetTop)
//       }
// }))
      this.currentDatestamp = datestamps.reduce((p, c) => {
        if (c.offsetTop < messageScroll.scrollTop + c.offsetHeight) return c.innerText
        else return p
      }, datestamps[0].innerText)
      // console.log(messageScroll.scrollHeight, messageScroll.clientHeight, messageScroll.scrollTop)
      // console.log('currentDatestamp', this.currentDatestamp)
    }
  }
}
</script>

<style lang='scss' scoped>
#current-datestamp {
  border-bottom-right-radius: .25rem;
  border-bottom-left-radius: .25rem;
}
.unread-messages-button{
  position: absolute;
  top: -3rem;
  left: 0
}
</style>
