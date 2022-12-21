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
import * as DOMPurify from 'dompurify'

export default {
  name: 'BaseRawEvent',
  mixins: [helpersMixin],
  props: {event: {type: Object, required: true}},
  components: {
    BaseButtonCopy,
  },

  computed: {
    cleaned() {
      console.log('cleaned', JSON.parse(DOMPurify.sanitize(JSON.stringify(this.event))))
      if (Array.isArray(this.event)) return this.event.map(event => cleanEvent(this.sanitize(event)))
      return cleanEvent(this.sanitize(this.event))
    }
  },

  methods: {
    sanitize(event) {
      return JSON.parse(DOMPurify.sanitize(JSON.stringify(this.event)))
    },
  }
}
</script>
