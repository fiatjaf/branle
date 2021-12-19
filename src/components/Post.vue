<template>
  <q-card flat>
    <q-dialog v-model="dialogReply">
      <Reply :event="event" :dialog="dialogReply" />
    </q-dialog>

    <q-card-section class="no-shadow" horizontal>
      <q-card-section class="no-shadow">
        <q-btn round @click="toProfile(event.pubkey)">
          <q-avatar class="no-shadow">
            <img :src="$store.getters.avatar(event.pubkey)" />
          </q-avatar>
        </q-btn>
      </q-card-section>

      <q-card-section class="col no-shadow">
        <q-card-section @click="dialogReply = true">
          <q-item-label
            >{{ $store.getters.displayName(event.pubkey) }}
            <small>
              {{ niceDate(event.created_at) }}
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
  props: {event: {type: Object, required: true}},
  data() {
    return {
      dialogReply: false
    }
  }
}
</script>
