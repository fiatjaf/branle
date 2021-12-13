<template>
  <q-page>
    <Publish />
    <Post v-for="event in homeFeed" :key="event.id" :event="event" />
  </q-page>
</template>

<script>
import helpersMixin from '../utils/mixin'
import {dbGetHomeFeedNotes} from '../db'

export default {
  name: 'Home',
  mixins: [helpersMixin],

  data() {
    return {
      homeFeed: []
    }
  },

  async mounted() {
    this.homeFeed = await dbGetHomeFeedNotes(
      this.$store.state.following.concat(this.$store.state.keys.pub),
      100
    )
  }
}
</script>
