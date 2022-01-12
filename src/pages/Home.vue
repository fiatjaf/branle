<template>
  <q-page class="px-4 pt-6">
    <div class="text-xl">Home</div>

    <Publish />

    <q-infinite-scroll :disable="reachedEnd" :offset="150" @load="loadMore">
      <Thread v-for="thread in homeFeed" :key="thread[0].id" :events="thread" />
    </q-infinite-scroll>
  </q-page>
</template>

<script>
import helpersMixin from '../utils/mixin'
import {addToThread} from '../utils/threads'
import {dbGetHomeFeedNotes, onNewHomeFeedNote} from '../db'

export default {
  name: 'Home',
  mixins: [helpersMixin],

  data() {
    return {
      listener: null,
      reachedEnd: false,
      homeFeed: [],
      notesSet: new Set()
    }
  },

  async mounted() {
    let notes = await dbGetHomeFeedNotes(50)
    if (notes.length > 0) {
      this.reachedEnd = false
    }

    for (let i = notes.length - 1; i >= 0; i--) {
      addToThread(this.homeFeed, notes[i])
      this.notesSet.add(notes[i].id)
    }

    this.listener = onNewHomeFeedNote(event => {
      if (this.notesSet.has(event.id)) return

      addToThread(this.homeFeed, event)
      this.notesSet.add(event.id)
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

      let loadedNotes = await dbGetHomeFeedNotes(
        50,
        Math.min.apply(
          Math,
          this.homeFeed.flat().map(event => event.created_at)
        ) - 1
      )
      if (loadedNotes.length === 0) {
        this.reachedEnd = true
      }
      for (let i = loadedNotes.length - 1; i >= 0; i--) {
        addToThread(this.homeFeed, loadedNotes[i])
        this.notesSet.add(event.id)
      }
      done()
    }
  }
}
</script>
