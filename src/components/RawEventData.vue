<template>
  <q-card class="px-4 py-2">
    <q-card-section>
      <div class="text-lg text-bold tracking-wide leading-relaxed py-2">
        Raw Event Data
      </div>
      <pre class="font-mono">{{ json(eventWithoutLocalMetadata) }}</pre>
    </q-card-section>
  </q-card>
</template>

<script>
import helpersMixin from '../utils/mixin'

export default {
  name: 'RawEventData',
  mixins: [helpersMixin],
  props: {event: {type: Object, required: true}},

  computed: {
    eventWithoutLocalMetadata() {
      let {_id, _rev, ...event} = this.event
      return event
    }
  }
}
</script>
