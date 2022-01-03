<template>
  <q-page class="px-4 pt-6 relative">
    <div class="text-xl">
      Chat with
      <span
        class="text-secondary cursor-pointer"
        @click="toProfile($route.params.pubkey)"
      >
        {{ $store.getters.displayName($route.params.pubkey) }}
      </span>
    </div>

    <q-separator class="my-6" />

    <div class="flex flex-col justify-end absolute left-5 bottom-5 right-5">
      <div ref="chatScroll" class="overflow-y-auto">
        <div v-for="event in messages" :key="event.id">
          <Balloon :event="event" />
        </div>
      </div>

      <q-form @submit="submitMessage" @reset="text = ''">
        <div class="flex w-full mt-4">
          <q-input v-model="text" autofocus class="w-full" filled>
            <template #append>
              <q-btn
                unelevated
                class="mx-4"
                label="Send"
                type="submit"
                color="secondary"
                @click="submitMessage"
              />
            </template>
          </q-input>
        </div>
      </q-form>
    </div>
  </q-page>
</template>

<script>
import {debounce} from 'quasar'

import helpersMixin from '../utils/mixin'
import {getElementFullHeight, isElementFullyScrolled} from '../utils/helpers'
import {dbGetMessages, onNewMessage} from '../db'

export default {
  name: 'Messages',
  mixins: [helpersMixin],

  data() {
    return {
      listener: null,
      messages: [],
      canLoadMore: false,
      text: ''
    }
  },

  watch: {
    '$route.params.pubkey'(curr, prev) {
      if (curr && curr !== prev) this.restart()
    }
  },

  created() {
    this.debouncedHandleScroll = debounce(this.handleScroll, 500)
  },

  async mounted() {
    // set chat scroll area height
    let otherElementsTotalSize =
      getElementFullHeight(this.$refs.chatScroll.parentNode.previousSibling) +
      getElementFullHeight(
        this.$refs.chatScroll.parentNode.previousSibling.previousSibling
      ) +
      getElementFullHeight(this.$refs.chatScroll.nextSibling)
    let extraMarginAtTheTop = 40
    this.$refs.chatScroll.style.height = `calc(100vh - ${
      otherElementsTotalSize + extraMarginAtTheTop
    }px)`

    // load peer profile if it exists
    this.$store.dispatch('useProfile', {pubkey: this.$route.params.pubkey})

    // load saved messages and start listening for new ones
    this.restart()

    // listen for scroll events (all quasar helpers fail miserably, let's do it manually)
    this.$refs.chatScroll.addEventListener('scroll', this.debouncedHandleScroll)
  },

  async beforeUnmount() {
    if (this.listener) this.listener.cancel()
    this.$refs.chatScroll.removeEventListener(
      'scroll',
      this.debouncedHandleScroll
    )
  },

  methods: {
    async restart() {
      if (this.listener) this.listener.cancel()

      this.$store.commit('haveReadMessage', this.$route.params.pubkey)
      this.$store.dispatch('useProfile', {pubkey: this.$route.params.pubkey})
      this.messages = await dbGetMessages(this.$route.params.pubkey, 100)

      if (this.messages.length > 0) {
        await this.scrollToBottom()
        this.canLoadMore = true
      }

      this.listener = onNewMessage(this.$route.params.pubkey, async event => {
        if (this.messages.length === 0) {
          this.messages.push(event)
        } else {
          let last = this.messages[this.messages.length - 1]
          if (
            last.pubkey === event.pubkey &&
            last.created_at + 120 >= event.created_at
          ) {
            last.appended = last.appended || []
            last.appended.push(event)
          } else {
            this.messages.push(event)
          }
        }

        if (isElementFullyScrolled(this.$refs.chatScroll)) {
          await this.scrollToBottom()
        }

        this.$store.commit('haveReadMessage', this.$route.params.pubkey)
      })
    },

    handleScroll(ev) {
      if (!this.canLoadMore) return

      if (this.$refs.chatScroll.scrollTop === 0) this.loadMore()
    },

    async scrollToBottom() {
      return new Promise(resolve =>
        setTimeout(() => {
          this.$refs.chatScroll.scroll({
            top: this.$refs.chatScroll.scrollHeight + 1000,
            left: 0,
            behavior: 'smooth'
          })
          resolve()
        }, 10)
      )
    },

    async submitMessage() {
      await this.$store.dispatch('sendChatMessage', {
        pubkey: this.$route.params.pubkey,
        text: this.text
      })

      this.text = ''
    },

    async loadMore() {
      if (this.messages.length === 0) {
        this.canLoadMore = false
        return
      }

      let newMessages = await dbGetMessages(
        this.$route.params.pubkey,
        100,
        this.messages[0].created_at - 1
      )

      if (newMessages.length === 0) {
        this.canLoadMore = false
      } else {
        // scroll down such that we stay at the same place we were (instead of
        // staying at the top of the scrolled screen where the new messages will be)
        let currentScrollBottom =
          this.$refs.chatScroll.scrollHeight -
          this.$refs.chatScroll.scrollTop -
          this.$refs.chatScroll.clientHeight

        setTimeout(() => {
          let newScrollTop =
            this.$refs.chatScroll.scrollHeight -
            currentScrollBottom -
            this.$refs.chatScroll.clientHeight

          this.$refs.chatScroll.scroll(0, newScrollTop)
        }, 100)
      }

      this.messages = newMessages.concat(this.messages)
    }
  }
}
</script>
