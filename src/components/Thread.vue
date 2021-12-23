<template>
  <div class="flex">
    <div v-for="event in events" :key="event.id" class="w-full">
      <Post :event="event" item />
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
  }
}
</script>
