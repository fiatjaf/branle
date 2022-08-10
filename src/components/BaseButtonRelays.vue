<template>
  <q-dialog v-model="relayListDialog" @before-hide='$emit("hide")'>
    <q-card>
      <div class='flex row justify-end'>
        <q-btn icon="close" flat dense v-close-popup/>
      </div>
      <div class='overflow-auto'>
        <BaseRelayList v-for='(ev) in events' :key='ev.id' :event="ev" />
      </div>
    </q-card>
  </q-dialog>
  <q-btn
    icon="sync_alt"
    unelevated
    clickable
    @click='toggleRelayListDialog'
    :class='"" + buttonClass'
    :size='buttonSize'
    class='button-relays'
    :label='verbose ? "relays" : ""'
    dense
    align="left"
  >
    <q-tooltip v-if='!verbose'>
      seen on relays
    </q-tooltip>
  </q-btn>
</template>

<script>
import { defineComponent } from 'vue'
// import {onEventUpdate} from '../db'
import BaseRelayList from 'components/BaseRelayList.vue'

export default defineComponent({
  name: 'BaseButtonRelays',
  emits: ['dialog', 'hide'],
  components: {
    BaseRelayList,
  },
  data() {
    return {
      relayListDialog: false,
    }
  },
  props: {
    event: {
      type: Object,
      required: true
    },
    buttonClass: {
      type: String,
      required: false,
      default: ''
    },
    buttonSize: {
      type: String,
      required: false,
      default: 'sm'
    },
    verbose: {
      type: Boolean,
      default: false,
    }
  },

  computed: {
    events() {
      if (Array.isArray(this.event)) return this.event
      return [this.event]
    }
  },

  methods: {
    toggleRelayListDialog() {
      this.relayListDialog = !this.relayListDialog
      this.$emit('dialog', this.relayListDialog)
    },
  }
})
</script>

<style>
.button-relays {
  opacity: .7;
  transition: all .3s ease-in-out;
}
.button-relays:hover {
  opacity: 1;
}
</style>
