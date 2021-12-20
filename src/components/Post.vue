<template>
  <q-item
    :class="highlighted ? 'py-6' : 'py-4'"
    :style="{backgroundColor: highlighted ? 'rgba(255, 255, 255, 0.7)' : null}"
  >
    <q-item-section avatar>
      <q-avatar
        class="no-shadow cursor-pointer"
        @click="toProfile(event.pubkey)"
      >
        <img :src="$store.getters.avatar(event.pubkey)" />
      </q-avatar>
    </q-item-section>

    <q-item-section>
      <q-item-label lines="1" class="flex justify-between items-center">
        <div class="flex items-center">
          <div
            v-if="$store.getters.hasName(event.pubkey)"
            class="cursor-pointer font-bold text-secondary mr-2"
            @click="toProfile(event.pubkey)"
          >
            {{ $store.getters.displayName(event.pubkey) }}
          </div>
          <div class="text-slate-400 font-mono text-xs">
            {{ shorten(event.pubkey) }}
          </div>
          <div
            v-if="standalone && tagged"
            class="text-emerald-300 text-xs ml-3"
          >
            related to
            <span
              class="cursor-pointer text-emerald-400 font-bold hover:underline"
              @click="toEvent(tagged)"
            >
              {{ shorten(tagged) }}
            </span>
          </div>
        </div>
        <div
          class="text-slate-500 cursor-pointer hover:underline text-xs"
          @click="toEvent(event.id)"
        >
          {{ niceDate(event.created_at) }}
        </div>
      </q-item-label>
      <q-item-label class="break-all pt-1 pl-1 text-base font-sans">
        {{ event.content }}
      </q-item-label>
    </q-item-section>
  </q-item>
</template>

<script>
import helpersMixin from '../utils/mixin'

export default {
  mixins: [helpersMixin],
  props: {
    event: {type: Object, required: true},
    highlighted: {type: Boolean, default: false},
    standalone: {type: Boolean, default: false}
  },

  data() {
    return {}
  },

  computed: {
    tagged() {
      for (let i = this.event.tags.length - 1; i >= 0; i--) {
        let tag = this.event.tags[i]
        if (tag.length === 2 && tag[0] === 'e') {
          return tag[1]
        }
      }
      return null
    }
  }
}
</script>
