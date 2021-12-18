<template>
  <q-page class="px-4 pt-6 relative">
    <div class="text-xl">
      Chat with
      <span class="text-secondary">
        {{ $store.getters.displayName($route.params.pubkey) }}
      </span>
    </div>

    <q-separator class="my-6" />

    <div class="flex-col justify-end absolute left-5 bottom-5 right-5">
      <q-infinite-scroll
        ref="chatScroll"
        reverse
        :disable="reachedEnd"
        :offset="250"
        @load="loadMore"
      >
        <div v-for="event in messages" :key="event.id">
          <q-chat-message
            :text="[event.plaintext]"
            :name="$store.getters.displayName(event.pubkey)"
            :avatar="$store.getters.avatar(event.pubkey)"
            :sent="event.pubkey === $store.state.keys.pub"
            :stamp="niceDate(new Date(event.created_at))"
            :bg-color="
              event.pubkey === $store.state.keys.pub ? 'primary' : 'tertiary'
            "
          >
          </q-chat-message>
        </div>
      </q-infinite-scroll>
      <q-form @submit="submitMessage" @reset="text = ''">
        <div class="flex w-full mt-4">
          <q-input v-model="text" class="w-full" filled>
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
import helpersMixin from '../utils/mixin'
import {dbGetMessages, onNewMessage} from '../db'

export default {
  name: 'Chat',
  mixins: [helpersMixin],

  data() {
    return {
      listener: null,
      messages: [],
      reachedEnd: false,
      text: ''
    }
  },

  watch: {
    '$route.params.pubkey'(curr, prev) {
      if (curr && curr !== prev) this.restart()
    }
  },

  async mounted() {
    this.$store.dispatch('useProfile', this.$route.params.pubkey)
    this.restart()
  },

  async beforeUnmount() {
    if (this.listener) this.listener.cancel()
  },

  methods: {
    async restart() {
      if (this.listener) this.listener.cancel()
      this.messages = await dbGetMessages(this.$route.params.pubkey, 100)
      this.listener = onNewMessage(this.$route.params.pubkey, event => {
        this.messages.push(event)
        this.scroll()
      })
    },

    scroll() {
      this.$refs.chatScroll.scroll({top: 10000, left: 0, behavior: 'smooth'})
    },

    async submitMessage() {
      await this.$store.dispatch('sendChatMessage', {
        pubkey: this.$route.params.pubkey,
        text: this.text
      })

      this.text = ''
    },

    async loadMore(_, done) {
      if (this.messages.length === 0) {
        this.reachedEnd = true
        done()
        return
      }

      let newMessages = await dbGetMessages(
        100,
        this.messages[0].created_at - 1
      )
      if (newMessages.length === 0) {
        this.reachedEnd = true
      }
      this.messages = newMessages.concat(this.messages)
      done()
    }
  }
}
</script>
