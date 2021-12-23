<template>
  <q-item
    :class="{
      'transition-colors': true,
      'py-4': !highlighted,
      'hover:bg-white/50': !highlighted && item,
      'py-6': highlighted,
      'bg-white/70': highlighted
    }"
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
      <q-item-label
        class="break-all pt-1 pl-1 text-base font-sans flex"
        :class="{'cursor-pointer': item}"
        @mousedown="startClicking"
        @mouseup="finishClicking"
      >
        <Markdown>
          {{ trimmedContent }}
          <template #append>
            <q-icon
              v-if="hasMore"
              name="more_horiz"
              color="primary"
              class="
                bg-white
                drop-shadow
                border-1
                px-2
                py-1
                ml-1
                -translate-y-1
              "
            />
          </template>
        </Markdown>
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
    standalone: {type: Boolean, default: false},
    item: {type: Boolean, default: false}
  },

  data() {
    return {
      clicking: false
    }
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
    },

    trimmedContent() {
      if (this.event.content.length > 280) {
        return this.event.content.slice(0, 270)
      }

      return this.event.content
    },

    hasMore() {
      if (this.event.content.length > 270) return true
      return false
    }
  },

  methods: {
    startClicking() {
      this.clicking = true
      setTimeout(() => {
        this.clicking = false
      }, 300)
    },

    finishClicking(ev) {
      if (ev.target.tagName === 'A') return

      if (this.clicking) this.toEvent(this.event.id)
    }
  }
}
</script>
