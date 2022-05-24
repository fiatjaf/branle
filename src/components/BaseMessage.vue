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
          v-if='!isEmbeded && evt.taggedEvents && render'
          class='flex column text-left full-width q-pb-xs embeded-message'
          style='display: block;'
          :clickable='false'
        >
          <div v-for='(taggedEvent, index) in evt.taggedEvents' :key='taggedEvent.id + "_" + index + "_" + render'>
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
              @click.capture.prevent.stop
            />
          </div>
        </div>

        <div v-if='isEmbeded' class='flex row justify-between q-gutter-md' :class='sent ? "reverse" : ""'>
          <BaseUserName :pubkey='evt.pubkey' :fallback='true' />
          <span> {{niceDate(event.created_at)}} </span>
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
              <!-- <q-item-section>reply</q-item-section> -->
              <BaseButtonReply
                button-class='text-accent full-width justify-start'
                :verbose='true'
                @reply='reply(evt)'
              />
            </div>
            <div v-close-popup>
              <!-- <div-section>copy</div-section> -->
              <BaseButtonCopy
                button-class='text-accent full-width justify-start'
                :button-text='evt.interpolated.text'
                :verbose='true'
              />
            </div>
            <div >
              <!-- <div-section>info</div-section> -->
              <BaseButtonInfo
                button-class='text-accent full-width justify-start'
                :event='evt'
                :verbose='true'
                @hide='hideMenu'
                @dialog='togglePersistentMenu'
              />
            </div>
            <div>
              <!-- <div-section>relays</div-section> -->
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
// import {decrypt} from 'nostr-tools/nip04'
import helpersMixin from '../utils/mixin'
// import {pool} from '../pool'
// import {dbGetEvent} from '../db'
import BaseButtonRelays from 'components/BaseButtonRelays.vue'
import BaseButtonInfo from 'components/BaseButtonInfo.vue'
import BaseButtonCopy from 'components/BaseButtonCopy.vue'
import BaseButtonReply from 'components/BaseButtonReply.vue'
import BaseMarkdown from 'components/BaseMarkdown.vue'

export default {
  name: 'BaseMessage',
  emits: ['reply', 'scroll-to'],
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
      // metadataDialog: false,
      invisible: true,
      reposts: {},
      menu: {},
      render: 1,
      contextMenus: [],
      persistentMenu: false,
    }
  },

  computed: {
    sequence() {
      let sequence = [this.event].concat(this.event.appended).filter(x => x)
      // this.interpolateMessageMentions(sequence)
      return sequence
    },
    // text() {
    //   return this.sequence.map(evt => this.interpolateMentions(evt.text, evt.tags).text)
    // },

    sent() {
      return this.event.pubkey === this.$store.state.keys.pub
    },
  },

  mounted() {
    // this.menu = this.menu.fill(false, 0, this.sequence.length)
    setTimeout(() => {
      this.invisible = false
    }, 20)
    if (this.event.taggedEvents)
      setTimeout(() => {
        // console.log('rerender event: ', this.event)
        this.render++
        this.$emit('scroll-to')
      }, 1000)
    // this.sequence.forEach(event => {
    //   if (event.interpolated.mentionEvents) {
    //     this.reposts[event.id] = []
    //     this.listenReposts(event.interpolated.mentionEvents, this.reposts[event.id])
    //   }
    //   this.menu[event.id] = false
    // })
  },

  methods: {
    reply(event) {
      console.log(event)
      this.$emit('reply', event)
    },

    hideMenu() {
      this.contextMenus = this.contextMenus.map(menu => false)
      this.togglePersistentMenu(false)
    },

    togglePersistentMenu(value) {
      this.persistentMenu = value
    }

    // copyText(defaultText) {
    //   let selection = window.getSelection().toString()
    //   if (selection) {
    //     return selection
    //   } else return defaultText
    // },
  }
}
</script>
<!-- :class='event.pubkey === $store.state.keys.pub ? "bg-primary" : "bg-secondary"'

  margin: .8rem 0;
  gap: .25rem;
  -->
<style lang='scss'>
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
  opacity: .7;
  padding: .3rem .15rem 0;
}
.message-sent .message-bubbles {
  border-right: 3px solid $primary;
}
.message-received .message-bubbles {
  border-left: 3px solid $secondary;
}
.message-sent .message-bubble {
}
.message-sent .first-message {
  border-top-left-radius: .8rem;
  border-top-right-radius: 0rem;
}
.message-sent .last-message {
  border-bottom-left-radius: .8rem;
  border-bottom-right-radius: 0;
}
.message-received .message-bubble {
}
.message-received .first-message {
  border-top-right-radius: .8rem;
  border-top-left-radius: 0rem;
}
.message-received .last-message {
  border-bottom-right-radius:  .8rem;
  border-bottom-left-radius:  0rem;
}
.message-bubbles {
  gap: .5rem;
}
.message-bubble {
  padding: .5rem 1rem;
  background: rgba(255, 255, 255, 0.1);
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
  border-right: 2px solid $primary;
  border-left: 0;
}
.embeded-message .message-received .message-bubbles {
  border-left: 2px solid $secondary;
  border-right: 0;
}
.embeded-message .message-menu {
  display: none;
}
</style>

