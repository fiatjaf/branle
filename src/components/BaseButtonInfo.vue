<template>
  <q-dialog v-model="metadataDialog" @before-hide='$emit("hide")'>
    <q-card class='flex column no-wrap' style='max-height: 90%'>
      <div class='flex row justify-end'>
        <q-btn icon="close" flat dense v-close-popup/>
      </div>
      <div class='overflow-auto'>
        <BaseRawEvent v-for='(ev) in events' :key='ev.id' :event="ev" />
      </div>
    </q-card>
  </q-dialog>
    <q-btn
      icon="info"
      unelevated
      clickable
      @click.stop='toggleMetadataDialog()'
      :class='"" + buttonClass'
      :size='buttonSize'
      class='button-info'
      :label='verbose ? "info" : ""'
      dense
      align="left"
    />
</template>

<script>
import { defineComponent } from 'vue'
import BaseRawEvent from 'components/BaseRawEvent.vue'

export default defineComponent({
  name: 'BaseButtonInfo',
  emits: ['dialog', 'hide'],
  components: {
    BaseRawEvent
  },
  data() {
    return {
      metadataDialog: false,
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
    toggleMetadataDialog() {
      this.metadataDialog = !this.metadataDialog
      this.$emit('dialog', this.metadataDialog)
    },
  }
})
</script>

<style>
.button-info {
  opacity: .7;
  transition: all .3s ease-in-out;
}
.button-info:hover {
  opacity: 1;
}
</style>
