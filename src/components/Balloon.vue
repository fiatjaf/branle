<template>
  <q-dialog v-model="metadataDialog">
    <RawEventData :event="event" />
  </q-dialog>

  <q-chat-message
    :class="{invisible}"
    :text="text"
    :name="$store.getters.displayName(event.pubkey)"
    :avatar="$store.getters.avatar(event.pubkey)"
    :sent="event.pubkey === $store.state.keys.pub"
    :stamp="niceDate(new Date(event.created_at))"
    :bg-color="event.pubkey === $store.state.keys.pub ? 'primary' : 'tertiary'"
    @click="click"
  />
</template>

<script>
import {decrypt} from 'nostr-tools/nip04'

import helpersMixin from '../utils/mixin'

export default {
  name: 'Balloon',
  mixins: [helpersMixin],
  props: {event: {type: Object, required: true}},

  data() {
    return {
      metadataDialog: false,
      invisible: true
    }
  },

  computed: {
    text() {
      return [this.event]
        .concat(this.event.appended)
        .filter(x => x)
        .map(event => this.getPlaintext(event))
    }
  },

  mounted() {
    setTimeout(() => {
      this.invisible = false
    }, 150)
  },

  methods: {
    getPlaintext(event) {
      if (
        event.tags.find(
          ([tag, value]) => tag === 'p' && value === this.$store.state.keys.pub
        )
      ) {
        // it is addressed to us
        // decrypt it
        let [ciphertext, iv] = event.content.split('?iv=')
        return decrypt(
          this.$store.state.keys.priv,
          event.pubkey,
          ciphertext,
          iv
        )
      } else if (event.pubkey === this.$store.state.keys.pub) {
        // it is coming from us
        let [_, target] = event.tags.find(([tag]) => tag === 'p')
        // decrypt it
        let [ciphertext, iv] = event.content.split('?iv=')
        return decrypt(this.$store.state.keys.priv, target, ciphertext, iv)
      }
    },

    click(e) {
      if (e.target.classList.contains('q-message-stamp')) {
        this.metadataDialog = true
      } else if (e.target.classList.contains('q-message-avatar')) {
        this.$router.push(this.toProfile(this.event.pubkey))
      }
    }
  }
}
</script>
