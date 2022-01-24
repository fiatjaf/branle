<template>
  <q-dialog v-model="metadataDialog">
    <RawEventData :event="event" />
  </q-dialog>

  <q-item
    class="
      overflow-hidden
      transition-colors
      py-3
      hover:bg-white-100/30
      border-gray-150
    "
    :style="{backgroundColor: highlighted ? 'rgba(255, 255, 255, 0.7)' : null}"
  >
    <q-item-section avatar style="height: 100%">
      <div v-if="showVerticalLineTop" class="is-reply"></div>
      <q-avatar
        class="no-shadow cursor-pointer"
        @click="toProfile(event.pubkey)"
      >
        <img :src="$store.getters.avatar(event.pubkey)" />
      </q-avatar>
      <div v-if="showVerticalLineBottom" class="has-reply"></div>
    </q-item-section>

    <q-item-section>
      <q-item-label lines="1" class="flex justify-between items-center">
        <div class="flex items-center">
          <Name :pubkey="event.pubkey" />
          <div class="text-accent font-mono text-xs">
            {{ shorten(event.pubkey) }}
          </div>
        </div>
        <div class="flex items-center">
          <q-icon
            size="xs"
            name="info"
            class="opacity-50 cursor-pointer mr-2"
            @click="metadataDialog = true"
          />
          <div
            class="opacity-40 cursor-pointer hover:underline text-xs"
            @click="toEvent(event.id)"
          >
            {{ niceDate(event.created_at) }}
          </div>
        </div>
      </q-item-label>
      <q-item-label
        v-if="
          tagged &&
          (position === 'standalone' ||
            ((position === 'single' || position === 'first') &&
              ($route.name === 'home' || $route.name === 'profile')))
        "
        class="text-xs"
      >
        <span class="opacity-50">in reply to&nbsp;</span>
        <span
          class="cursor-pointer text-info font-bold hover:underline"
          @click="toEvent(tagged)"
        >
          {{ shorten(tagged) }}
        </span>
      </q-item-label>
      <q-item-label
        class="pt-1 text-base font-sans flex break-words text-justify"
        style="hyphens: auto !important"
        :class="{'cursor-pointer': $route.params.eventId !== event.id}"
        @mousedown="startClicking"
        @mouseup="finishClicking"
      >
        <Markdown v-if="event.kind === 1">
          {{ content }}
        </Markdown>
        <Recommend v-else-if="event.kind === 2" :url="event.content" />
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
    position: {type: String, default: 'standalone'}
  },

  data() {
    return {
      metadataDialog: false,
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

    content() {
      return this.interpolateMentions(this.event.content, this.event.tags)
    },

    showVerticalLineTop() {
      return this.position === 'middle' || this.position === 'last'
    },

    showVerticalLineBottom() {
      return this.position === 'middle' || this.position === 'first'
    }
  },

  methods: {
    startClicking() {
      if (this.event.kind === 2) return

      this.clicking = true
      setTimeout(() => {
        this.clicking = false
      }, 200)
    },

    finishClicking(ev) {
      if (ev.target.tagName === 'A') return

      if (this.clicking) this.toEvent(this.event.id)
    },
  }
}
</script>
<style type="css" scoped>
.has-reply {
  width: 2px;
  position: absolute;
  top: 55px;
  left: 35px;
  height: 100vh;
  @apply bg-gray-400;
}
.is-reply {
  width: 2px;
  position: absolute;
  top: 0;
  left: 35px;
  height: 8px;
  @apply bg-gray-400;
}
</style>
