<template>
  <q-dialog v-model="metadataDialog">
    <RawEventData :event="event" />
  </q-dialog>

  <q-page class="px-4 py-6">
    <div class="text-xl text-center">Event</div>

    <q-separator class="my-6" />

    <div v-if="ancestors.length">
      <Thread :events="ancestors" />
    </div>

    <div ref="main" class="py-4 px-1">
      <div v-if="event">
        <div class="flex items-center">
          <q-avatar
            class="no-shadow cursor-pointer"
            @click="toProfile(event.pubkey)"
          >
            <img :src="$store.getters.avatar(event.pubkey)" />
          </q-avatar>
          <div
            v-if="$store.getters.hasName(event.pubkey)"
            class="cursor-pointer font-bold text-secondary ml-4 text-lg"
            @click="toProfile(event.pubkey)"
          >
            {{ $store.getters.displayName(event.pubkey) }}
          </div>
          <div class="text-slate-400 font-mono ml-4">
            {{ shorten(event.pubkey) }}
          </div>
        </div>
        <div
          class="text-xl my-4 font-sans break-words text-justify"
          style="hyphens: auto !important"
        >
          <Markdown>{{ event.content }}</Markdown>
        </div>
        <div class="flex items-center justify-between w-full">
          <q-icon
            size="xs"
            name="info"
            class="text-slate-300 cursor-pointer mr-1"
            @click="metadataDialog = true"
          />
          <div
            class="text-slate-500 cursor-pointer hover:underline"
            @click="toEvent(event.id)"
          >
            {{ niceDate(event.created_at) }}
          </div>
          <q-btn
            :disable="!$store.state.keys.priv"
            round
            unelevated
            flat
            :color="replying ? 'secondary' : 'primary'"
            icon="quickreply"
            size="lg"
            @click="replying = !replying"
          />
        </div>
        <div v-if="replying" class="mt-4">
          <Reply v-if="event" :event="event" />
        </div>
      </div>
      <div v-else class="font-mono text-slate-400 p-8">
        Event {{ $route.params.eventId }}
      </div>
    </div>

    <div v-if="childrenThreads.length">
      <q-separator class="my-2" />
      <div class="text-lg mx-4 mt-6 mb-4">Replies</div>
      <div v-for="thread in childrenThreads" :key="thread[0].id">
        <Thread :events="thread" />
        <q-separator />
      </div>
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
      metadataDialog: false,
      replying: false,
      userHasActed: false,
      ancestors: [],
      ancestorsSet: new Set(),
      ancestorsSub: null,
      event: null,
      eventSub: null,
      childrenThreads: [],
      childrenSet: new Set(),
      childrenSub: null
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
      this.event = await dbGetEvent(this.$route.params.eventId)
      if (this.event) {
        this.$store.dispatch('useProfile', this.event.pubkey)
        this.listenAncestors()
      } else {
        this.eventSub = pool.sub(
          {
            filter: {ids: [this.$route.params.eventId]},
            cb: async event => {
              this.eventSub.unsub()
              this.event = event
              this.$store.dispatch('useProfile', this.event.pubkey)
              this.listenAncestors()
            }
          },
          'event-browser'
        )
      }

      this.listenChildren()
    },

    listenChildren() {
      this.childrenThreads = []
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

            // filter just tagged event ids from tags
            let taggedEvents = event.tags.filter(([t, v]) => t === 'e' && v)

            let thread = this.childrenThreads.find(threadEvents => {
              return threadEvents.find(tevt => {
                return taggedEvents.find(([_, v]) => tevt.id === v)
              })
            })
            if (thread) {
              // this is a member of an existing thread
              thread.push(event)

              // sort thread according to internal thread tag hierarchy
              thread.sort((a, b) => {
                if (a.tags.find(([_, v]) => v === b.id)) {
                  // a has a reference to b, sort b before a
                  return 1
                } else if (b.tags.find(([_, v]) => v === a.id)) {
                  // b has a reference to a, sort a before b
                  return -1
                } else {
                  // doesn't matter
                  return 0
                }
              })
            } else {
              // its own thread
              this.childrenThreads.push([event])
            }

            return
          }
        },
        'event-children'
      )
    },

    listenAncestors() {
      this.ancestors = []
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

              this.$store.dispatch('useProfile', event.pubkey)
              this.ancestorsSet.add(event.id)

              // manual sorting
              // older events first
              for (let i = 0; i < this.ancestors.length; i++) {
                if (event.created_at < this.ancestors[i].created_at) {
                  // the new event is older than the current index,
                  // so we add it at the previous index
                  this.ancestors.splice(i - 1, 0, event)
                  return
                }
              }

              // the newer event is the newest, add to end
              this.ancestors.push(event)

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
