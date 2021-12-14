<template>
  <q-page class="px-4 py-6 relative">
    <div class="text-xl">
      Chat with
      <span class="text-secondary">
        {{ $store.getters.displayName($route.params.pubkey) }}
      </span>
    </div>

    <q-separator class="my-6" />

    <div class="flex-col justify-end absolute left-5 bottom-12 right-5">
      <q-scroll-area
        ref="chatScroll"
        :thumb-style="{
          left: '102%',
          backgroundColor: 'red',
          width: '10px',
          opacity: 0.35
        }"
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
      </q-scroll-area>
      <q-toolbar>
        <q-toolbar-title>
          <q-form @submit="submitMessage" @reset="text = ''">
            <div class="flex w-full">
              <q-input v-model="text" class="w-full" filled>
                <template #append>
                  <q-btn
                    unelevated
                    class="mx-4"
                    label="Send"
                    type="submit"
                    color="secondary"
                  />
                </template>
              </q-input>
            </div>
          </q-form>
        </q-toolbar-title>
      </q-toolbar>
    </div>
  </q-page>
</template>

<script>
import helpersMixin from '../utils/mixin'
import {dbGetMessages} from '../db'

export default {
  name: 'Chat',
  mixins: [helpersMixin],

  data() {
    return {
      messages: [],
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

  methods: {
    async restart() {
      this.messages = await dbGetMessages(this.$route.params.pubkey, 100)
    },

    async scroll() {
      const scrollArea = this.$refs.chatScroll
      const scrollTarget = scrollArea.getScrollTarget()
      const duration = 350
      scrollArea.setScrollPosition(scrollTarget.scrollHeight, duration)
    },

    async submitMessage() {
      await this.$store.dispatch('sendChatMessage', {
        pubkey: this.$route.params.pubkey,
        text: this.text
      })

      this.text = ''
      this.scroll()
    }
  }
}
</script>
