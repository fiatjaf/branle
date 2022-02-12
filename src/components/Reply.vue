<template>
  <q-form class="px-24" @submit="sendReply">
    <q-input
      ref="input"
      v-model="text"
      autogrow
      autofocus
      label="Reply to this note"
      maxlength="280"
      @keypress.ctrl.enter="sendReply"
    >
    </q-input>

    <div class="flex justify-end mt-2">
      <q-btn label="Reply" rounded unelevated type="submit" color="primary" />
    </div>
  </q-form>
</template>

<script>
import helpersMixin from '../utils/mixin'
import {getPubKeyTagWithRelay, getEventTagWithRelay} from '../utils/helpers'

export default {
  mixins: [helpersMixin],

  props: {
    event: {type: Object, required: true}
  },

  data() {
    return {
      text: ''
    }
  },

  computed: {
    textarea() {
      return this.$refs.input.$el.querySelector('textarea')
    },
    mentions() {
      return this.createMentionsProvider()
    }
  },

  mounted() {
    this.mentions.attach(this.textarea)
  },

  beforeUnmount() {
    this.mentions.detach(this.textarea)
  },

  methods: {
    async sendReply() {
      if (!this.text.length) {
        return
      }
      // build tags
      let tags = []

      // remove invalid tags and/or not p/e
      let usableTags = this.event.tags.filter(
        ([t, v]) => (t === 'p' || t === 'e') && v
      )

      // add last 4 pubkeys mentioned
      let pubkeys = usableTags.filter(([t, v]) => t === 'p').map(([_, v]) => v)
      for (let i = 0; i < Math.min(4, pubkeys.length); i++) {
        tags.push(await getPubKeyTagWithRelay(pubkeys[pubkeys.length - 1 - i]))
      }
      // plus the author of the note being replied to, if not present already
      if (!tags.find(([_, v]) => v === this.event.pubkey)) {
        tags.push(await getPubKeyTagWithRelay(this.event.pubkey))
      }

      // add the first and the last event ids
      let first = usableTags.find(([t, v]) => t === 'e')
      if (first) tags.push(first)
      let last = getEventTagWithRelay(this.event)
      tags.push(last)

      // remove ourselves
      tags = tags.filter(([_, v]) => v !== this.$store.state.keys.pub)

      let event = await this.$store.dispatch('sendPost', {
        message: this.text,
        tags
      })
      if (event) this.toEvent(event.id)
    }
  }
}
</script>
