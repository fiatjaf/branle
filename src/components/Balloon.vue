<template>
  <q-dialog v-model="metadataDialog">
    <RawEventData :event="sequence" />
  </q-dialog>

  <q-chat-message
    class="text-base font-sans break-words text-justify"
    style="hyphens: auto !important"
    :class="{invisible}"
    :text="text"
    :name="$store.getters.displayName(event.pubkey)"
    :avatar="$store.getters.avatar(event.pubkey)"
    :sent="event.pubkey === $store.state.keys.pub"
    :stamp="niceDate(new Date(event.created_at))"
    :bg-color="event.pubkey === $store.state.keys.pub ? 'primary' : 'tertiary'"
    @click="click"
  />

  <q-menu context-menu>
    <q-list dense>
      <q-item div class="py-3">
        <q-item-section>
          <div class="text-md font-semibold">Seen on relays:</div>
          <ul class="pl-1 text-sm list-disc">
            <li v-for="relay in event.seen_on" :key="relay">
              {{ relay }}
            </li>
          </ul>
        </q-item-section>
      </q-item>
    </q-list>
  </q-menu>
</template>

<script>
import helpersMixin from '../utils/mixin'

export default {
  name: 'Balloon',
  mixins: [helpersMixin],
  props: {event: {type: Object, required: true}},

  data() {
    return {
      metadataDialog: false,
      invisible: true
    }
  },

  computed: {
    sequence() {
      return [this.event].concat(this.event.appended).filter(x => x)
    },

    text() {
      return this.sequence.map(evt => evt.text)
    }
  },

  mounted() {
    setTimeout(() => {
      this.invisible = false
    }, 20)
  },

  methods: {
    click(e) {
      if (e.target.classList.contains('q-message-stamp')) {
        this.metadataDialog = true
      } else if (e.target.classList.contains('q-message-avatar')) {
        this.$router.push(this.toProfile(this.event.pubkey))
      }
    }
  }
}
</script>
