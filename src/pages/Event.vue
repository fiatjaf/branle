<template>
  <q-page class="px-4 py-6">
    <div class="text-xl text-center">Event</div>

    <q-separator class="my-6" />

    <Post v-if="event" :event="event" />
    <div v-else class="font-mono text-slate-400 p-8">
      Event {{ $route.params.eventId }}
    </div>

    <Reply v-if="event" :event="event" />

    <q-separator class="my-6" />

    <div v-if="related.length">
      <div class="text-lg mx-4">Related</div>
      <Post v-for="rel in related" :key="rel.id" :event="rel" item />
    </div>
  </q-page>
</template>

<script>
import helpersMixin from '../utils/mixin'
import {pool} from '../pool'
import {dbGetEvent} from '../db'

export default {
  name: 'Event',
  mixins: [helpersMixin],

  data() {
    return {
      event: null,
      eventSub: null,
      related: [],
      relatedSet: new Set(),
      relatedSub: null
    }
  },

  watch: {
    '$route.params.eventId'(curr, prev) {
      if (curr && curr !== prev) this.listen()
    }
  },

  async mounted() {
    this.event = await dbGetEvent(this.$route.params.eventId)
    if (!this.event) {
      this.eventSub = pool.sub(
        {
          filter: {id: this.$route.params.eventId},
          cb: async event => {
            this.event = event
            this.eventSub.unsub()
          }
        },
        'event-fetcher'
      )
    }

    this.listen()
  },

  beforeUnmount() {
    if (this.relatedSub) this.relatedSub.unsub()
    if (this.eventSub) this.eventSub.unsub()
  },

  methods: {
    listen() {
      this.related = []
      this.relatedSet = new Set()

      this.relatedSub = pool.sub(
        {
          filter: [
            {
              '#e': this.$route.params.eventId,
              kind: 1
            }
          ],
          cb: async event => {
            if (this.relatedSet.has(event.id)) return
            this.relatedSet.add(event.id)

            // manual sorting
            // newer events first
            for (let i = 0; i < this.related.length; i++) {
              if (event.created_at > this.related[i].created_at) {
                // the new event is newer than the current index,
                // so we add it at the previous index
                this.related.splice(i - 1, 0, event)
                return
              }
            }

            // the newer event is the oldest, add to end
            this.related.push(event)

            return
          }
        },
        'event-browser'
      )
    }
  }
}
</script>
