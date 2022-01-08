<template>
  <q-card class="no-shadow bg-inherit">
    <q-card-section class="pt-0">
      <q-form class="q-form border-gray-150 border-t pt-4" @submit="sendReply">
        <q-input
          v-model="text"
          dense
          autogrow
          autofocus
          label="Post your reply"
          maxlength="280"
        >
          <template #before>
            <q-avatar
              round
              size="40px"
              class="cursor-pointer mr-3"
              @click="toProfile($store.state.keys.pub)"
            >
              <img :src="$store.getters.avatar($store.state.keys.pub)" />
            </q-avatar>
          </template>
        </q-input>
        <div class="flex justify-end mt-3">
          <q-btn
            v-close-popup
            label="Reply"
            rounded
            unelevated
            type="submit"
            color="primary"
            :disable="!$store.state.keys.priv"
          />
        </div>
      </q-form>
    </q-card-section>
  </q-card>
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
      // build tags
      let tags = []

      // remove invalid tags and/or not p/e
      let usableTags = this.event.tags.filter(
        ([t, v]) => (t === 'p' || t === 'e') && v
      )

      // add last 4 pubkeys mentioned
      let pubkeys = usableTags.filter(([t, v]) => t === 'p').map(([_, v]) => v)
      for (let i = 0; i < Math.min(4, pubkeys.length); i++) {
        tags.push(['p', pubkeys[pubkeys.length - 1 - i]])
      }
      // plus the author of the note being replied to, if not present already
      if (!tags.find(([_, v]) => v === this.event.pubkey)) {
        tags.push(['p', this.event.pubkey])
      }

      // add the first and the last event ids
      let first = usableTags.find(([t, v]) => t === 'e')
      if (first) {
        let [_, v] = first
        tags.push(['e', v])
      }
      tags.push(['e', this.event.id])

      // remove ourselves
      tags = tags.filter(([_, v]) => v !== this.$store.state.keys.pub)

      this.$store.dispatch('sendPost', {
        message: this.text,
        tags
      })
      this.text = ''
    }
  }
}
</script>
