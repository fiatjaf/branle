<template>
  <q-dialog v-model="metadataDialog">
    <RawEventData :event="event" />
  </q-dialog>

  <q-page class="px-4 py-6">
    <div class="text-xl text-center">Event</div>

    <q-separator class="my-6" />

    <div v-if="ancestors.length">
      <Thread :events="ancestors" is-ancestors />
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
          <div class="text-lg ml-4">
            <Name :pubkey="event.pubkey" />
          </div>
          <div class="text-accent font-mono ml-4">
            {{ shorten(event.pubkey) }}
          </div>
        </div>
        <div
          class="text-xl my-4 font-sans break-words text-justify"
          style="hyphens: auto !important"
        >
          <Markdown>{{ content }}</Markdown>
        </div>
        <div class="flex items-center justify-between w-full">
          <q-icon
            size="xs"
            name="info"
            class="opacity-50 cursor-pointer mr-1"
            @click="metadataDialog = true"
          />
          <div
            class="opacity-40 cursor-pointer hover:underline"
            @click="toEvent(event.id)"
          >
            {{ niceDate(event.created_at) }}
          </div>
          <q-btn
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

    <div v-if="event?.seen_on?.length">
      <q-separator class="my-2" />
      <div class="text-lg mx-4 mt-6 mb-4">Seen on</div>
      <ul class="mb-2 pl-4 text-md list-disc">
        <li v-for="relay in event.seen_on" :key="relay">
          <span class="text-accent opacity-65">
            {{ relay }}
          </span>
        </li>
      </ul>
    </div>

    <div v-if="missingFrom.length">
      <div class="text-lg mx-4 mt-6 mb-4">Not seen on</div>
      <ul class="mb-2 pl-4 text-md list-disc">
        <li v-for="relay in missingFrom" :key="relay" class="cursor-pointer">
          {{ relay }}
          <q-btn
            label="Publish"
            rounded
            unelevated
            color="accent"
            size="xs"
            class="py-0 px-1 ml-2"
            @click="publishTo(relay)"
          />
        </li>
      </ul>
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
import {pool} from '../pool'
import {dbGetEvent, onEventUpdate} from '../db'
import helpersMixin from '../utils/mixin'
import {addToThread} from '../utils/threads'

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
      childrenSeen: new Map(),
      childrenSub: null,
      eventUpdates: null
    }
  },

  computed: {
    missingFrom() {
      // filter out events we don't have locally as they are from people we don't follow
      if (!this.event || !this.event.seen_on) return []

      return Object.entries(this.$store.state.relays)
        .filter(([_, prefs]) => prefs.write)
        .map(([url, _]) => url)
        .filter(url => this.event.seen_on.indexOf(url) === -1)
    },
    content() {
      return this.interpolateMentions(this.event.content, this.event.tags)
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
      if (this.eventUpdates) this.eventUpdates.cancel()
      window.removeEventListener('scroll', this.detectedUserActivity)
      window.removeEventListener('click', this.detectedUserActivity)
    },

    detectedUserActivity() {
      this.userHasActed = true
    },

    async listen() {
      this.event = await dbGetEvent(this.$route.params.eventId)
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

      // listen to changes to the event in the db so we get .seen_on updates
      this.eventUpdates = await onEventUpdate(
        this.$route.params.eventId,
        event => {
          // once we get an update from the db we know we can stop listening for relay updates
          if (this.eventSub) this.eventSub.unsub()

          // and just update our local event with the latest one from the db
          this.event = event
        }
      )

      this.listenChildren()
    },

    listenChildren() {
      this.childrenThreads = []
      this.childrenSeen = new Map()
      this.childrenSub = pool.sub(
        {
          filter: [
            {
              '#e': [this.$route.params.eventId],
              kinds: [1]
            }
          ],
          cb: async (event, relay) => {
            let existing = this.childrenSeen.get(event.id)
            if (existing) {
              existing.seen_on.push(relay)
              return
            }

            event.seen_on = [relay]
            this.childrenSeen.set(event.id, event)

            this.$store.dispatch('useProfile', {pubkey: event.pubkey})

            addToThread(this.childrenThreads, event)
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

              this.$store.dispatch('useProfile', {
                pubkey: event.pubkey,
                request: true
              })
              this.ancestorsSet.add(event.id)

              // manual sorting
              // older events first
              for (let i = 0; i < this.ancestors.length; i++) {
                if (event.created_at < this.ancestors[i].created_at) {
                  // the new event is older than the current index,
                  // so we add it at the previous index
                  this.ancestors.splice(i, 0, event)
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
    },

    publishTo(relayURL) {
      pool.relays[relayURL]?.relay?.publish?.(this.event)
    }
  }
}
</script>
