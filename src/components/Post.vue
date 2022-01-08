<template>
  <q-dialog v-model="metadataDialog">
    <RawEventData :event="event" />
  </q-dialog>

  <q-item
    v-if="!event.isReplyToReply || expandReplies"
    class="overflow-hidden transition-colors"
    :class="{
      'py-3': !highlighted,
      'hover:bg-white/50': !highlighted && item,
      'py-6 bg-white/70': highlighted,
      'border-gray-150 border-t': !event.isReply,
      'border-gray-150 border-b':
        (isEventPage && !event.replies.length) || (!isEventPage && isLastReply)
    }"
    :style="{backgroundColor: highlighted ? 'rgba(255, 255, 255, 0.7)' : null}"
  >
    <q-item-section avatar style="height: 100%">
      <div
        v-if="
          level === 2 ||
          (!(expandReplies && isFirstReply) && !isRoot && event.isReply)
        "
        class="is-reply"
      ></div>
      <q-avatar
        class="no-shadow cursor-pointer"
        @click="toProfile(event.pubkey)"
      >
        <img :src="$store.getters.avatar(event.pubkey)" />
      </q-avatar>
      <div
        v-if="
          (!isRoot && event.replies.length) ||
          (!isEventPage && event.replies.length) ||
          (!isEventPage && level != 0 && !isLastReply)
        "
        class="has-reply"
      ></div>
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
        </div>
        <div class="flex items-center">
          <q-icon
            size="xs"
            name="info"
            class="text-slate-300 cursor-pointer mr-2"
            @click="metadataDialog = true"
          />
          <div
            class="text-slate-500 cursor-pointer hover:underline text-xs"
            @click="toEvent(event.id)"
          >
            {{ niceDate(event.created_at) }}
          </div>
        </div>
      </q-item-label>
      <q-item-label
        class="pt-1 text-base font-sans flex break-words text-justify"
        :class="{'cursor-pointer': item}"
        style="hyphens: auto !important"
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
              class="bg-white drop-shadow border-1 px-2 py-1 ml-1 -translate-y-1"
            />
          </template>
        </Markdown>
      </q-item-label>
      <div class="row justify-end mt-2 text-gray-400">
        <q-btn flat round size="sm" icon="chat_bubble_outline" />
      </div>
    </q-item-section>
  </q-item>
  <q-item v-else class="py-0">
    <q-item-section><div class="dashed-line"></div></q-item-section>
    <q-item-section>
      <q-item-label class="text-center"
        ><a href="#" @click.prevent="toEvent(event.root)">Show replies</a>
      </q-item-label></q-item-section
    >
    <q-item-section></q-item-section>
  </q-item>

  <Reply v-if="isRoot" :event="event" class="border-gray-150 border-b" />

  <Post
    v-for="(reply, index) in event.replies"
    :key="reply.id"
    :event="reply"
    standalone
    :is-last-reply="index + 1 == event.replies.length"
    :is-first-reply="index === 0 || level + 1 == 1"
    :expand-replies="expandReplies"
    :level="level + 1"
    :is-event-page="isEventPage"
    item
  />
</template>

<script>
import helpersMixin from '../utils/mixin'

export default {
  mixins: [helpersMixin],
  props: {
    event: {type: Object, required: true},
    highlighted: {type: Boolean, default: false},
    standalone: {type: Boolean, default: false},
    item: {type: Boolean, default: false},
    isLastReply: {type: Boolean, default: false},
    isFirstReply: {type: Boolean, default: true},
    level: {type: Number, default: 0},
    isRoot: {type: Boolean, default: false},
    isEventPage: {type: Boolean, default: false},
    expandReplies: {type: Boolean, default: false}
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

    trimmedContent() {
      if (this.event.content.length > 280) {
        return this.event.content.slice(0, 270)
      }

      return this.event.content
    },

    hasMore() {
      if (this.event.content.length > 280) return true
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
.dashed-line {
  border-right: 2px dashed;
  @apply border-gray-400;
  height: 100%;
  width: 21px;
}
</style>
