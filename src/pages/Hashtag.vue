<template>
  <q-page>
    <div class="text-h5 text-bold q-py-md">{{'#' + this.$route.params.hashtagId}}</div>
    <q-separator color='accent' size='2px'/>
        <div>
          <BasePostThread v-for="thread in threads" :key="thread[0].id" :events="thread" @add-event='processEvent'/>
        </div>
  </q-page>
</template>

<script>
import { defineComponent } from 'vue'
import {dbStreamTagKind} from '../query'
import helpersMixin from '../utils/mixin'
import {addToThread} from '../utils/threads'

export default defineComponent({
  name: 'Hashtag',
  mixins: [helpersMixin],

  data() {
    return {
      threads: [],
      eventsSet: new Set(),
      sub: {},
    }
  },

  watch: {
    '$route.params.hashtagId'(curr, prev) {
      if (curr !== prev && curr && prev) {
        this.stop()
        this.start()
      }
    }
  },

  activated() {
    this.start()
  },

  deactivated() {
    this.stop()
  },

  methods: {

    async start() {
      this.threads = []
      this.eventsSet = new Set()

      this.sub.hashtag = await dbStreamTagKind('t', this.$route.params.hashtagId.toLowerCase(), 1, event => {
        this.processEvent(event)
      })

      this.sub.hashtagOld = await dbStreamTagKind('hashtag', this.$route.params.hashtagId.toLowerCase(), 1, event => {
        this.processEvent(event)
      })
    },

    stop() {
      if (this.sub.hashtag) this.sub.hashtag.cancel()
      if (this.sub.oldHashtag) this.sub.oldHashtag.cancel()
      this.threads = []
      this.eventsSet = new Set()
    },

    processEvent(event) {
      if (this.eventsSet.has(event.id)) return

      this.interpolateEventMentions(event)
      this.eventsSet.add(event.id)
      addToThread(this.threads, event, '', event.pubkey !== this.$store.state.keys.pub)
      return
    },
  }
})
</script>

<style lang='scss' scoped>
.q-tabs {
  border-bottom: 1px solid $accent
}
</style>
