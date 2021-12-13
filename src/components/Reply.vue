<template>
  <q-card class="border-none w-1/2 min-w-fit">
    <q-card-section class="no-shadow" vertical>
      <q-card-section class="no-shadow" horizontal>
        <q-card-section class="no-shadow q-pb-none">
          <q-avatar>
            <q-img :src="$store.getters.avatar(event.pubkey)" />
          </q-avatar>
        </q-card-section>

        <q-card-section>
          <q-item-label class="mb-3">
            <span class="text-secondary">
              {{ $store.getters.displayName(event.pubkey) }}
            </span>
            <small class="ml-4 text-slate-600">{{
              niceDate(event.created_at)
            }}</small>
          </q-item-label>
          {{ event.content }}
          <div></div>
        </q-card-section>
      </q-card-section>

      <q-card-section class="no-shadow">
        <div>
          <q-form @submit="sendReply">
            <q-input
              v-model="text"
              dense
              style="font-size: 20px"
              autogrow
              label="Reply to this note"
              maxlength="280"
            >
            </q-input>

            <div class="flex justify-end mt-2">
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

  props: {
    event: {type: Object, required: true},
    dialog: {type: Object, default: null}
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
        tags: [['e', this.event.id]]
      })
      this.text = ''

      this.dialog?.hide()
    }
  }
}
</script>
