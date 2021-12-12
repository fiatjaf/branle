<template>
  <q-card class="border-none">
    <q-card-section class="no-shadow" vertical>
      <q-card-section class="no-shadow" horizontal>
        <q-card-section class="no-shadow q-pb-none">
          <q-avatar class="no-shadow">
            <img :src="$store.getters.avatar(event.pubkey)" />
          </q-avatar>
        </q-card-section>

        <q-separator vertical style="display: none" />

        <q-card-section class="col no-shadow q-pb-none">
          <q-item-label
            >{{ $store.getters.displayName(event.pubkey) }}
            <small style="color: grey">{{ niceDate(event.created_at) }}</small>
          </q-item-label>
          {{ event.content }}
          <div></div>
        </q-card-section>
      </q-card-section>

      <q-card-section class="no-shadow q-pa-none q-pl-xl">
        <div>
          <q-form class="q-gutter-md" @submit="sendReply">
            <q-input
              v-model="text"
              dense
              style="font-size: 20px"
              autogrow
              maxlength="280"
            >
            </q-input>

            <div class="flex justify-end">
              <q-btn
                label="Reply"
                rounded
                unelevated
                type="submit"
                color="primary"
              />
            </div>
          </q-form>
        </div>
      </q-card-section>
    </q-card-section>
  </q-card>
</template>

<script>
import helpersMixin from '../utils/mixin'

export default {
  mixins: [helpersMixin],

  props: ['event'],
  data() {
    return {
      text: ''
    }
  },
  methods: {
    sendReply() {
      this.$store.dispatch('sendPost', {
        message: this.text,
        tags: [['e', this.event.id]]
      })
      this.text = ''
    }
  }
}
</script>
