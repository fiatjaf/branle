<template>
  <div
    class='relative-position flex column'
    :class='(sent ? "message-sent" : "message-received")'
    @click.stop
  >
        <div
          v-if='!isEmbeded'
          class='text-accent timestamp'
        >
          {{timeUTC(event.created_at)}}
        </div>
    <div class='flex column message-bubbles'>
      <div
        v-for='(evt, idx) in sequence'
        :key='idx'
        class='message-bubble'
        :class='((idx === 0) || (sequence.length === 1) ? " first-message" : "") +
          (idx === sequence.length - 1 ? " last-message" : "")'
      >
        <div
          v-if='!isEmbeded && taggedEvents[evt.id] && render'
          class='flex column text-left full-width q-pb-xs embeded-message'
          style='display: block;'
          :clickable='false'
        >
          <div v-for='(taggedEvent) in taggedEvents[evt.id]' :key='taggedEvent.id + "_" + taggedEvents[evt.id].length + "_" + render'>
            <div v-if='taggedEvent.kind === 1 || taggedEvent.kind === 2' class='reposts'>
              <BasePost
                :event='taggedEvent'
                :manual-focus='false'
                :is-embeded='true'
                @contextmenu.capture.stop="toEvent(taggedEvent.id)"
              />
            </div>
            <BaseMessage
              v-else-if='taggedEvent.kind === 4'
              :event='taggedEvent'
              class='no-padding no-margin'
              :is-embeded='true'
              clickable
              @mounted="$emit('mounted')"
              @click.capture.prevent.stop
            />
          </div>
        </div>

        <div v-if='isEmbeded' class='flex row justify-between q-gutter-md' :class='sent ? "reverse" : ""'>
          <BaseUserName :pubkey='evt.pubkey' :fallback='true' />
          <span> {{niceDateUTC(event.created_at)}} </span>
        </div>
        <BaseMarkdown>
          {{ evt.interpolated.text }}
        </BaseMarkdown>
        <q-menu
        v-if='!isEmbeded'
          v-model='contextMenus[idx]'
          touch-position
          context-menu
          :persistent='persistentMenu'
          @click.stop
        >
          <q-list dense class='flex column q-gutter-xs q-pa-xs'>
            <div v-close-popup>
              <BaseButtonReply
                button-class='text-accent full-width justify-start'
                :verbose='true'
                @reply='reply(evt)'
              />
            </div>
            <div v-close-popup>
              <BaseButtonCopy
                button-class='text-accent full-width justify-start'
                :button-text='evt.interpolated.text'
                :verbose='true'
              />
            </div>
            <div >
              <BaseButtonInfo
                button-class='text-accent full-width justify-start'
                :event='evt'
                :verbose='true'
                @hide='hideMenu'
                @dialog='togglePersistentMenu'
              />
            </div>
            <div>
              <BaseButtonRelays
                button-class='text-accent full-width justify-start'
                :event='evt'
                :verbose='true'
                @hide='hideMenu'
                @dialog='togglePersistentMenu'
              />
            </div>
          </q-list>
        </q-menu>
      </div>
    </div>
  </div>
</template>

<script>
import { useQuasar } from 'quasar'
import helpersMixin from '../utils/mixin'
import BaseButtonRelays from 'components/BaseButtonRelays.vue'
import BaseButtonInfo from 'components/BaseButtonInfo.vue'
import BaseButtonCopy from 'components/BaseButtonCopy.vue'
import BaseButtonReply from 'components/BaseButtonReply.vue'
import BaseMarkdown from 'components/BaseMarkdown.vue'

export default {
  name: 'BaseMessage',
  emits: ['reply', 'mounted'],
  mixins: [helpersMixin],
  props: {
    event: {type: Object, required: true},
    isEmbeded: {type: Boolean, default: false}
  },
  components: {
    BaseButtonRelays,
    BaseButtonInfo,
    BaseButtonCopy,
    BaseButtonReply,
    BaseMarkdown,
  },

  setup() {
    const $q = useQuasar()
    $q.platform.has.touch
  },

  data() {
    return {
      invisible: true,
      menu: {},
      render: 1,
      contextMenus: [],
      persistentMenu: false,
      taggedEvents: {}
    }
  },

  computed: {
    sequence() {
      let sequence = [this.event].concat(this.event.appended).filter(x => x)
      // this.interpolateMessageMentions(sequence)
      if (this.render) return sequence
      return sequence
    },

    sent() {
      return this.event.pubkey === this.$store.state.keys.pub
    },
  },

  mounted() {
    setTimeout(() => {
      this.invisible = false
    }, 20)
    for (let ev of this.sequence) {
      let tagged = ev.tags?.filter(([t, v]) => t === 'e' && v).map(([t, v]) => v) || []
      if (tagged.length) {
        this.taggedEvents[ev.id] = []
        this.processTaggedEvents(tagged, this.taggedEvents[ev.id])
      }
    }
    if (this.event.created_at < this.$store.state.lastMessageRead[this.$route.params.pubkey]) this.$emit('mounted')
  },

  methods: {
    reply(event) {
      this.$emit('reply', event)
    },

    hideMenu() {
      this.contextMenus = this.contextMenus.map(menu => false)
      this.togglePersistentMenu(false)
    },

    togglePersistentMenu(value) {
      this.persistentMenu = value
    }
  }
}
</script>
<style lang='css'>
.message-sent,
.message-received {
  max-width: min(90%, 400px);
}
.message-sent {
  align-self: end;
  text-align: right;
}
.message-received {
  align-self: start;
  text-align: left;
}
.timestamp {
  font-size: .7rem;
  opacity: .9;
  padding: .3rem .15rem 0;
}
.message-sent .message-bubbles {
  border-right: 3px solid var(--q-primary);
}
.message-received .message-bubbles {
  border-left: 3px solid var(--q-secondary);
}
.message-sent .message-bubble {
}
.message-sent .first-message,
.message-received .message-sent .first-message {
  border-top-left-radius: .8rem;
  border-top-right-radius: 0rem;
}
.message-sent .last-message,
.message-received .message-sent .first-message {
  border-bottom-left-radius: .8rem;
  border-bottom-right-radius: 0;
}
.message-received .message-bubble {
}
.message-received .first-message,
.message-sent .message-received .first-message {
  border-top-right-radius: .8rem;
  border-top-left-radius: 0rem;
}
.message-received .last-message,
.message-sent .message-received .first-message {
  border-bottom-right-radius:  .8rem;
  border-bottom-left-radius:  0rem;
}
.message-bubbles {
  gap: .5rem;
}
.message-bubble {
  padding: .5rem 1rem;
  background: rgba(0, 0, 0, 0.08);
}
.body--dark .message-bubble {
  background: rgba(255, 255, 255, 0.15);
}
.message-menu {
  min-width: 200px;
}
.embeded-message {
  margin: 0;
  width: 100%;
}
.embeded-message .message-sent,
.embeded-message .message-received {
  font-size: .8rem;
  width: 100%;
  max-width: 100%;
}
.embeded-message .message-bubble {
  padding: .25rem .5rem;
}
.embeded-message .message-sent .message-bubbles {
  border-right: 2px solid var(--q-primary);
  border-left: 0;
}
.embeded-message .message-received .message-bubbles {
  border-left: 2px solid var(--q-secondary);
  border-right: 0;
}
.embeded-message .message-menu {
  display: none;
}
</style>

