<template>
  <q-page>
    <center>
      <strong class="text-h6 q-pa-lg">Chat</strong>
    </center>
    <q-btn
      v-go-back.single
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
          :thumb-style="thumbStyle"
          style="height: 100%; max-width: 100%"
        >
          <div v-for="message in messages" :key="message.id">
            <q-chat-message
              :text="[
                message.text +
                  (message.loading
                    ? '<small>sending...</small>'
                    : message.failed
                    ? '<small>failed. <a class=delete><i class=material-icons>cancel</i></a> <a class=retry><i class=material-icons>settings_backup_restore</i></a></small>'
                    : '')
              ]"
              :name="message.from.substring(0, 6) + '...'"
              :avatar="$store.getters.avatar(message.from)"
              :sent="
                message.from === $store.state.myProfile.pubkey ? true : false
              "
              :stamp="niceDate(new Date(message.created_at * 1000))"
              :bg-color="
                message.from === $store.state.myProfile.pubkey
                  ? 'primary'
                  : 'tertiary'
              "
              @click="ev => clickMessageAction(ev, message.id, message.text)"
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
                @reset="resetMessage"
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
      text: '',
      reload: 0, // a hack to recompute messages,
      thumbStyle: {
        left: '102%',
        backgroundColor: '#26A69A',
        width: '10px',
        opacity: 0.35
      }
    }
  },
  computed: {
    messages() {
      this.$store.state.chatUpdated // hack to recompute
      this.scroll()

      return (
        LocalStorage.getItem(`messages.${this.$route.params.pubkey}`).sort(
          function (a, b) {
            return a.created_at - b.created_at
          }
        ) || []
      )
    }
  },
  methods: {
    async scroll() {
      const scrollArea = this.$refs.chatScroll
      const scrollTarget = scrollArea.getScrollTarget()
      const duration = 350
      scrollArea.setScrollPosition(scrollTarget.scrollHeight, duration)
    },
    async failed() {
      var messages = this.$q.localStorage.getItem(
        `messages.${this.$route.params.pubkey}`
      )
      if (messages) {
        for (var i = 0; i < messages.length; i++) {
          if (messages[i].loading === true) {
            messages[i].failed = true
            messages[i].loading = false
            this.$q.localStorage.set(
              `messages.${this.$route.params.pubkey}`,
              messages
            )
          }
        }
      }
    },
    async submitMessage() {
      await this.$store.dispatch('sendChatMessage', {
        pubkey: this.$route.params.pubkey,
        text: this.text
      })

      this.text = ''
      this.$store.commit('chatUpdated')
      this.scroll()

      setTimeout(() => {
        this.$store.commit('chatUpdated') // another hack if post fails
        this.failed()
      }, 2000)
    },
    clickMessageAction(ev, id, text) {
      ev.preventDefault()

      var action = ev.target
      for (let i = 0; i < 5; i++) {
        if (action.classList.contains('retry')) {
          this.$store.dispatch('deleteChatMessage', {
            pubkey: this.$route.params.pubkey,
            id
          })
          this.text = text
          this.submitMessage()
        } else if (action.classList.contains('delete')) {
          this.$store.dispatch('deleteChatMessage', {
            pubkey: this.$route.params.pubkey,
            id
          })
          this.$store.commit('chatUpdated')
        }

        action = action.parentNode
      }
    },
    resetMessage() {
      this.text = ''
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
