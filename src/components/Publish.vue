<template>
  <q-card class="no-shadow py-6 bg-inherit">
    <q-card-section>
      <q-form @submit="sendPost">
        <q-input
          ref="input"
          v-model="text"
          autogrow
          autofocus
          label="What's happening?"
          maxlength="280"
          @keypress.ctrl.enter="sendPost"
        >
          <template #before>
            <q-avatar
              round
              size="60px"
              class="cursor-pointer mr-4"
              @click="toProfile($store.state.keys.pub)"
            >
              <img :src="$store.getters.avatar($store.state.keys.pub)" />
            </q-avatar>
          </template>
        </q-input>
        <div class="flex justify-end mt-3">
          <q-btn
            v-close-popup
            label="Publish"
            rounded
            unelevated
            type="submit"
            color="primary"
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

  data() {
    return {
      text: '',
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
    async sendPost() {
      if (!this.text.length) {
        return
      }
      let event = await this.$store.dispatch('sendPost', {message: this.text})
      if (event) this.toEvent(event.id)
    }
  }
}
</script>
