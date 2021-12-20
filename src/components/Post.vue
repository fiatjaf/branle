<template>
  <q-item class="my-3">
    <q-item-section avatar>
      <q-avatar
        class="no-shadow cursor-pointer"
        @click="toProfile(event.pubkey)"
      >
        <img :src="$store.getters.avatar(event.pubkey)" />
      </q-avatar>
    </q-item-section>

    <q-item-section>
      <q-item-label lines="1">
        <span
          v-if="$store.getters.hasName(event.pubkey)"
          class="cursor-pointer font-bold mr-2 text-secondary"
          @click="toProfile(event.pubkey)"
        >
          {{ $store.getters.displayName(event.pubkey) }}
        </span>
        <span class="text-slate-400 font-mono text-xs">
          {{ pubShort(event.pubkey) }}
        </span>
      </q-item-label>
      <q-item-label class="break-all pt-1 pl-1 text-base font-sans">
        {{ event.content }}
      </q-item-label>
    </q-item-section>

    <q-item-section
      top
      side
      class="cursor-pointer hover:underline text-sm"
      @click="toEvent(event.id)"
    >
      {{ niceDate(event.created_at) }}
    </q-item-section>
  </q-item>
</template>

<script>
import helpersMixin from '../utils/mixin'

export default {
  mixins: [helpersMixin],
  props: {event: {type: Object, required: true}},

  data() {
    return {}
  }
}
</script>
