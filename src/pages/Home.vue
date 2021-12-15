<template>
  <q-page>
    <Publish />
    <Post v-for="event in homeFeed" :key="event.id" :event="event" />
  </q-page>
</template>

<script>
import helpersMixin from '../utils/mixin'
import {dbGetHomeFeedNotes, onNewHomeFeedNote} from '../db'

export default {
  name: 'Home',
  mixins: [helpersMixin],

  data() {
    return {
      listener: null,
      homeFeed: []
    }
  },

  async mounted() {
    this.homeFeed = await dbGetHomeFeedNotes(100, 0)
    this.listener = onNewHomeFeedNote(event => {
      this.homeFeed.unshift(event)
    })
  },

  async beforeUnmount() {
    if (this.listener) this.listener.cancel()
  }
}
</script>
