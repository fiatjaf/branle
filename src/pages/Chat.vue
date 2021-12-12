<template>
  <q-page>
    <div class="text-center">
      <strong class="text-h6 q-pa-lg">Chat</strong>
    </div>
    <q-btn
      flat
      color="white"
      icon="arrow_back"
      label="back"
      class="small-screen-only fixed-top-left"
    />
    <div class="row">
      <br />
      <br />

      <div
        class="q-pa-md q-pt-xl column row flex justify-end no-wrap"
        style="width: 100%; height: 90vh; overflow: hidden"
      >
        <q-scroll-area
          ref="chatScroll"
          :thumb-style="{
            left: '102%',
            backgroundColor: 'red',
            width: '10px',
            opacity: 0.35
          }"
          style="height: 100%; max-width: 100%"
        >
          <div
            v-for="event in $store.state.events.kind4[$route.params.pubkey] ||
            []"
            :key="event.id"
          >
            <q-chat-message
              :text="[event.plaintext]"
              :name="$store.getters.displayName(event.pubkey)"
              :avatar="$store.getters.avatar(event.pubkey)"
              :sent="event.pubkey === $store.state.keys.pub"
              :stamp="niceDate(new Date(event.created_at * 1000))"
              :bg-color="
                event.pubkey === $store.state.keys.pub ? 'primary' : 'tertiary'
              "
            >
            </q-chat-message>
          </div>
        </q-scroll-area>
        <div class="bg-dark q-mb-xl">
          <q-toolbar>
            <q-toolbar-title>
              <q-form
                class="q-gutter-md"
                @submit="submitMessage"
                @reset="this.text = ''"
              >
                <div class="row">
                  <div class="col-8">
                    <q-input
                      v-model="text"
                      filled
                      type="text"
                      hint="500 char message"
                    ></q-input>
                  </div>
                  <div class="col-4">
                    <q-btn
                      v-if="text.length < 280"
                      class="float-left q-ml-xs q-mt-sm"
                      round
                      unelevated
                      color="primary"
                      icon="insert_emoticon"
                      size="sm"
                    >
                      <q-popup-proxy>
                        <q-btn
                          v-for="emoji in emojis1"
                          :key="emoji.item"
                          flat
                          rounded
                          unelevated
                          dense
                          @click="text = text + emoji.item"
                          >{{ emoji.item }}</q-btn
                        >
                        <br />
                        <q-btn
                          v-for="emoji in emojis2"
                          :key="emoji.item"
                          flat
                          rounded
                          unelevated
                          dense
                          @click="text = text + emoji.item"
                          >{{ emoji.item }}</q-btn
                        >
                      </q-popup-proxy>
                    </q-btn>
                    <q-btn
                      v-else
                      disable
                      class="float-left q-ml-xs q-mt-sm"
                      round
                      unelevated
                      color="primary"
                      icon="insert_emoticon"
                      size="sm"
                    />
                    <q-btn
                      unelevated
                      class="q-ma-sm"
                      label="send"
                      type="submit"
                      color="primary"
                    />
                  </div>
                </div>
              </q-form>
            </q-toolbar-title>
          </q-toolbar>
        </div>
      </div>
    </div>
  </q-page>
</template>

<script>
import {LocalStorage} from 'quasar'
import helpersMixin from '../utils/mixin'

export default {
  name: 'Chat',
  mixins: [helpersMixin],

  data() {
    return {
      text: ''
    }
  },
  methods: {
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

<style>
small {
  margin-top: 0.2rem;
  font-size: 0.8rem;
  text-align: right;
  display: block;
}
.delete {
  cursor: pointer;
}
.retry {
  cursor: pointer;
}
</style>
