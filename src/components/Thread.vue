<template>
  <div
    :class="
      'flex my-4 ml-[25px]' +
      (events.length > 1 ? ' border-l-8 border-slate-300' : '')
    "
  >
    <div
      v-for="event in filledEvents"
      :key="event.id"
      class="w-full -translate-x-[40px]"
    >
      <div v-if="event === 'FILLER'" class="ml-16 pl-3 mb-6 text-xl">
        <div class="h-3">.</div>
        <div class="h-3">.</div>
        <div class="h-3">.</div>
      </div>
      <Post v-else :event="event" item />
    </div>
  </div>
</template>

<script>
import helpersMixin from '../utils/mixin'

export default {
  name: 'Thread',
  mixins: [helpersMixin],
  props: {
    events: {type: Array, required: true}
  },

  computed: {
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
  }
}
</script>
