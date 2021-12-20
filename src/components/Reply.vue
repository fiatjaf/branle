<template>
  <q-form class="px-24" @submit="sendReply">
    <q-input
      v-model="text"
      dense
      autogrow
      label="Reply to this note"
      maxlength="280"
    >
    </q-input>

    <div class="flex justify-end mt-2">
      <q-btn label="Reply" rounded unelevated type="submit" color="primary" />
    </div>
  </q-form>
</template>

<script>
import helpersMixin from '../utils/mixin'

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

  methods: {
    sendReply() {
      this.$store.dispatch('sendPost', {
        message: this.text,
        tags: [
          ['p', this.event.pubkey],
          ['e', this.event.id]
        ]
      })
      this.text = ''
    }
  }
}
</script>
