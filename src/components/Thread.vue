<template>
  <div class="flex my-4 ml-[25px]">
    <div
      v-for="(event, index) in filledEvents"
      :key="event.id"
      class="w-full -translate-x-[33px]"
    >
      <ShowMore v-if="event === 'FILLER'" :root="root" />
      <Post v-else :event="event" :position="position(index)" />
    </div>
  </div>
</template>

<script>
import helpersMixin from '../utils/mixin'

export default {
  name: 'Thread',
  mixins: [helpersMixin],
  props: {
    events: {type: Array, required: true},
    isAncestors: {type: Boolean, default: false}
  },

  computed: {
    root() {
      return this.events[0].id
    },

    filledEvents() {
      if (this.events.length === 0) return []

      var filled = [this.events[0]]
      for (let i = 1; i < this.events.length; i++) {
        let curr = this.events[i]
        let prev = this.events[i - 1]
        if (curr.tags[curr.tags.length - 1][1] !== prev.id) {
          filled.push('FILLER')
        }

        filled.push(curr)
      }

      return filled
    }
  },

  methods: {
    position(index) {
      if (!this.isAncestors) {
        // normal thread
        if (this.filledEvents.length === 1) return 'single'
        if (index === 0) return 'first'
        if (index === this.filledEvents.length - 1) return 'last'
        return 'middle'
      } else {
        // in this mode the last event should have the left bar to the bottom,
        // as it will plug into the "main" event in the thread,
        // so 'single' is turned into 'first' and 'last' into 'middle'
        if (this.filledEvents.length === 1) return 'first'
        if (index === 0) return 'first'
        if (index === this.filledEvents.length - 1) return 'middle'
        return 'middle'
      }
    }
  }
}
</script>
