<template>
  <q-card>
    <q-card-section>
      <div class="text-subtitle1">
        raw event data
      <BaseButtonCopy :button-text='json(cleaned)'/>
      </div>
      <pre>{{ json(cleaned) }}</pre>
    </q-card-section>
  </q-card>
</template>

<script>
import helpersMixin from '../utils/mixin'
import {cleanEvent} from '../utils/event'
import BaseButtonCopy from 'components/BaseButtonCopy.vue'

export default {
  name: 'BaseRawEvent',
  mixins: [helpersMixin],
  props: {event: {type: Object, required: true}},
  components: {
    BaseButtonCopy,
  },

  computed: {
    cleaned() {
      if (Array.isArray(this.event)) return this.event.map(cleanEvent)
      return cleanEvent(this.event)
    }
  },

  // methods: {
  //   copyText(defaultText) {
  //     console.log('defaultText: ', defaultText)
  //     let selection = window.getSelection().toString()
  //       console.log('selection: ', selection)
  //     if (selection) {
  //       return selection
  //     } else return defaultText
  //   },
  // }
}
</script>
