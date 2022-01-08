<template>
  <q-page class="pt-4">
    <div class="text-xl pl-4">Home</div>

    <Publish />

    <q-infinite-scroll :disable="reachedEnd" :offset="150" @load="loadMore">
      <Post
        v-for="event in homeFeed"
        :key="event.id"
        :event="event"
        standalone
        item
      />
    </q-infinite-scroll>
  </q-page>
</template>

<script>
import helpersMixin from '../utils/mixin'
import {onNewHomeFeedNote} from '../db'
import {GetHomeFeed} from '../services/event'

export default {
  name: 'Home',
  mixins: [helpersMixin],

  data() {
    return {
      listener: null,
      reachedEnd: false,
      homeFeed: []
    }
  },

  async mounted() {
    this.homeFeed = await GetHomeFeed(50)
    if (this.homeFeed.length > 0) {
      this.reachedEnd = false
    }

    this.listener = onNewHomeFeedNote(event => {
      this.homeFeed.unshift(event)
    })
  },

  async beforeUnmount() {
    if (this.listener) this.listener.cancel()
  },

  methods: {
    async loadMore(_, done) {
      if (this.homeFeed.length === 0) {
        this.reachedEnd = true
        done()
        return
      }

      let loadedNotes = await GetHomeFeed(
        50,
        this.homeFeed[this.homeFeed.length - 1].created_at - 1
      )
      if (loadedNotes.length === 0) {
        this.reachedEnd = true
      }
      this.homeFeed = this.homeFeed.concat(loadedNotes)
      done()
    }
  }
}
</script>
