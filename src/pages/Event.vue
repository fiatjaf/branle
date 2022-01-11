<template>
  <q-page class="my-6">
    <div class="text-xl ml-4 mb-4">Event</div>

    <Post
      v-if="eventTree[0]"
      :event="eventTree[0]"
      is-event-page
      expand-replies
      item
      is-root
    />
  </q-page>
</template>

<script>
import helpersMixin from '../utils/mixin'
import {pool} from '../pool'
import {toEventTree, GetEvents} from '../services/event'

export default {
  name: 'Event',
  mixins: [helpersMixin],

  data() {
    return {
      metadataDialog: false,
      replying: false,
      userHasActed: false,
      ancestorsSet: new Set(),
      ancestorsSub: null,
      event: null,
      eventSub: null,
      childrenSet: new Set(),
      childrenSub: null,
      events: []
    }
  },
  computed: {
    eventTree() {
      return toEventTree(this.events)
    }
  },

  watch: {
    '$route.params.eventId'(curr, prev) {
      if (curr && curr !== prev) {
        this.stop()
        this.start()
      }
    }
  },

  mounted() {
    this.start()
  },

  beforeUnmount() {
    this.stop()
  },

  updated() {
    this.$nextTick(() => {
      if (this.screenHasMoved) {
        this.$refs.main.scrollIntoView()
      }
    })
  },

  methods: {
    start() {
      this.listen()
      window.addEventListener('scroll', this.detectedUserActivity)
      window.addEventListener('click', this.detectedUserActivity)
    },

    stop() {
      this.replying = false
      if (this.ancestorsSub) this.ancestorsSub.unsub()
      if (this.childrenSub) this.childrenSub.unsub()
      if (this.eventSub) this.eventSub.unsub()
      window.removeEventListener('scroll', this.detectedUserActivity)
      window.removeEventListener('click', this.detectedUserActivity)
    },

    detectedUserActivity() {
      this.userHasActed = true
    },

    async listen() {
      this.event = await GetEvents(this.$route.params.eventId)

      this.events.push(this.event)
      if (this.event) {
        this.$store.dispatch('useProfile', {
          pubkey: this.event.pubkey,
          request: true
        })
        this.listenAncestors()
      } else {
        this.eventSub = pool.sub(
          {
            filter: {ids: [this.$route.params.eventId]},
            cb: async event => {
              this.eventSub.unsub()
              this.event = event
              this.$store.dispatch('useProfile', {
                pubkey: this.event.pubkey,
                request: true
              })
              this.listenAncestors()
            }
          },
          'event-browser'
        )
      }

      this.listenChildren()
    },

    listenChildren() {
      this.childrenSet = new Set()
      this.childrenSub = pool.sub(
        {
          filter: [
            {
              '#e': [this.$route.params.eventId],
              kinds: [1]
            }
          ],
          cb: async event => {
            if (this.childrenSet.has(event.id)) return
            this.childrenSet.add(event.id)

            this.events.push(event)
            return
          }
        },
        'event-children'
      )
    },

    listenAncestors() {
      this.ancestorsSet = new Set()

      let eventTags = this.event.tags.filter(([t, _]) => t === 'e')
      if (eventTags.length) {
        this.ancestorsSub = pool.sub(
          {
            filter: [
              {
                kinds: [1],
                ids: eventTags.map(([_, v]) => v)
              }
            ],
            cb: async event => {
              if (this.ancestorsSet.has(event.id)) return

              this.$store.dispatch('useProfile', {
                pubkey: event.pubkey,
                request: true
              })
              this.ancestorsSet.add(event.id)

              this.events.push(event)
              return
            }
          },
          'event-ancestors'
        )
      }
    }
  }
}
</script>
