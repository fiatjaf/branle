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
      const tags = this.event.tags.filter(
        ([t, v]) =>
          (t === 'p' && v !== this.event.pubkey) ||
          (t === 'e' && v !== this.event.id)
      )
      tags.push(['p', this.event.pubkey])
      tags.push(['e', this.event.id])

      let self = tags.findIndex(
        ([t, v]) => t === 'p' && v === this.$store.state.keys.pub
      )
      if (self !== -1) tags.splice(self, 1)

      this.$store.dispatch('sendPost', {
        message: this.text,
        tags
      })
      this.text = ''
    }
  }
}
</script>
