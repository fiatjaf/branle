<template>
  <q-card class="my-card" flat style="border: none">
    <q-dialog v-model="dialogReply" position="top">
      <Reply :event="event" />
    </q-dialog>

    <q-card-section class="no-shadow" horizontal>
      <q-card-section class="no-shadow">
        <q-btn round @click="toProfile(event.pubkey)">
          <q-avatar class="no-shadow">
            <img :src="$store.getters.avatar(event.pubkey)" />
          </q-avatar>
        </q-btn>
      </q-card-section>

      <q-separator vertical style="display: none" />
      <q-card-section class="col no-shadow">
        <q-card-section class="q-pa-none" @click="dialogReply = true">
          <q-item-label
            >{{ $store.getters.displayName(event.pubkey) }}
            <small style="color: grey">
              {{ niceDate(event.created_at * 1000) }}
            </small>
          </q-item-label>
          {{ event.content }}
        </q-card-section>
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
      dialogReply: false
    }
  }
}
</script>
