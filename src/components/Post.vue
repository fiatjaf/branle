<template>
  <q-card class="my-card" flat style="border: none">
    <q-dialog v-model="dialogReply" position="top">
      <Reply :post="post" />
    </q-dialog>

    <q-card-section class="no-shadow" horizontal>
      <q-card-section class="no-shadow">
        <q-btn round @click="toProfile(post.pubkey)">
          <q-avatar class="no-shadow">
            <img :src="$store.getters.avatar(post.pubkey)" />
          </q-avatar>
        </q-btn>
      </q-card-section>

      <q-separator vertical style="display: none" />
      <q-card-section class="col no-shadow">
        <q-card-section class="q-pa-none" @click="dialogReply = true">
          <q-item-label
            >{{ $store.getters.displayName(post.pubkey) }}
            <small style="color: grey">
              {{ niceDate(post.created_at * 1000) }}
            </small>
          </q-item-label>
          {{ post.content }}
        </q-card-section>
        <div>
          <q-spinner-dots v-if="post.loading" color="primary" />
          <q-btn
            v-if="!post.retry && !post.loading"
            class="float-right q-mr-xs"
            round
            unelevated
            color="primary"
            flat
            icon="chat_bubble_outline"
            size="sm"
            @click="dialogReply = true"
          >
          </q-btn>
        </div>
      </q-card-section>
    </q-card-section>
  </q-card>
</template>

<script>
import helpersMixin from '../utils/mixin'

export default {
  mixins: [helpersMixin],
  props: ['post'],
  data() {
    return {
      dialogReply: false
    }
  }
}
</script>
