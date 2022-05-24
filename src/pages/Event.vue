<template>

  <q-page ref='page'>
    <div class="text-h5 text-bold q-py-md">thread</div>
    <q-separator color='accent' size='2px'/>
    <div v-if="ancestors.length">
      <BasePostThread :events="ancestors" is-ancestors @add-event='addEventAncestors'/>
    </div>

    <q-item ref="main" class='no-padding column'>
      <BasePost
        v-if="event"
        :event='event'
        :highlighted='true'
        :position='ancestors.length ? "last" : "standalone"'
        @add-event='addEventChildren'
      />
      <div v-else>
        Event {{ $route.params.eventId }}
      </div>
    <BaseRelayList v-if="event?.seen_on?.length" :event='event' style='background: rgba(255, 255, 255, 0.1);'/>
    </q-item>

    <q-separator color='accent' size='2px'/>

    <div v-if="childrenThreads.length">
      <div class="text-h6 text-bold">replies</div>
      <div v-for="(thread) in childrenThreads" :key="thread[0].id">
        <BasePostThread :events="thread" @add-event='addEventChildren'/>
      </div>
    </div>
  </q-page>
</template>

<script>
import { defineComponent, nextTick } from 'vue'
// import { parse } from 'JSON'
import {pool} from '../pool'
import {dbGetEvent, onEventUpdate} from '../db'
import helpersMixin from '../utils/mixin'
import {addToThread} from '../utils/threads'
// import { scroll } from 'quasar'
// const { getVerticalScrollPosition, setVerticalScrollPosition} = scroll
// import { scroll } from 'quasar'
// const { getScrollTarget, setScrollPosition } = scroll
import BaseRelayList from 'components/BaseRelayList.vue'

export default defineComponent({
  name: 'Event',
  emits: ['scroll-to-rect'],
  mixins: [helpersMixin],
  components: {
    BaseRelayList
  },

  data() {
    return {
      replying: false,
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

  // computed: {
  //   content() {
  //     return this.interpolateMentions(this.event.content, this.event.tags)
  //   },
  // },

  activated() {
    this.start()
  },

  deactivated() {
    this.stop()
  },

  methods: {
    start() {
      this.listen()
    },

    stop() {
      this.replying = false
      if (this.ancestorsSub) this.ancestorsSub.unsub()
      if (this.childrenSub) this.childrenSub.unsub()
      if (this.eventSub) this.eventSub.unsub()
      if (this.eventUpdates) this.eventUpdates.cancel()
    },

    async listen() {
      this.event = await dbGetEvent(this.$route.params.eventId)
      if (this.event) {
        this.$store.dispatch('useProfile', {
          pubkey: this.event.pubkey,
          request: true
        })
        this.interpolateEventMentions(this.event)
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
              this.interpolateEventMentions(this.event)
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
          this.interpolateEventMentions(this.event)
        }
      )
      if (this.$route.params.childThreads) this.childrenThreads = JSON.parse(this.$route.params.childThreads)
      else this.listenChildren()
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
              if (!Array.isArray(existing.seen_on)) existing.seen_on = []
              else if (existing.seen_on.includes(relay)) return
              existing.seen_on.push(relay)
              return
            }

            event.seen_on = [relay]
            this.childrenSeen.set(event.id, event)

            this.$store.dispatch('useProfile', {pubkey: event.pubkey})

            this.interpolateEventMentions(event)
            addToThread(this.childrenThreads, event)
            return
          }
        },
        'event-children'
      )
    },

    async listenAncestors() {
      this.ancestors = []
      this.ancestorsSet = new Set()

      let eventTags = this.event.interpolated.replyEvents
      if (eventTags.length === 2) await this.getAncestorsAncestorsFromDb(eventTags)
      if (eventTags.length) {
        this.ancestorsSub = pool.sub(
          {
            filter: [
              {
                kinds: [1],
                ids: eventTags
              }
            ],
            cb: async event => {
              if (this.ancestorsSet.has(event.id)) return

              this.$store.dispatch('useProfile', {
                pubkey: event.pubkey,
                request: true
              })
              this.interpolateEventMentions(event)
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
              this.scrollToMainEvent()

              return
            }
          },
          'event-ancestors'
        )
      }
    },

    async getAncestorsAncestorsFromDb(eventTags) {
      const initialEventId = eventTags[0]
      let lastEventId = eventTags[1]
      let addedAncestorCount = 0
      while (lastEventId !== initialEventId && addedAncestorCount <= 5) {
        // console.log('starting await, lastEventId: ', lastEventId)
        let lastEvent = await dbGetEvent(lastEventId)
        // console.log('finished await')
        if (lastEvent) {
          this.$store.dispatch('useProfile', {
            pubkey: lastEvent.pubkey,
            request: true
          })
          let lastEventTags = lastEvent.tags.filter(([t, _]) => t === 'e').map(([_, v]) => v)
          if (lastEventTags.length === 0) {
            // console.log(`last event ${lastEventId} has no tags prior to finding initial event ${initialEventId}`)
            break
          } else if (lastEventTags[0] !== initialEventId) {
            // console.log(`last event ${lastEventId} does not have initial event ${initialEventId} listed as initial event`)
            break
          } else if (lastEventTags.length > 2) {
            // console.log(`last event ${lastEventId} has more than 2 tags`)
            break
          }
          if (!eventTags.includes(lastEventId)) eventTags.push(lastEventId)
          lastEventId = lastEventTags[lastEventTags.length - 1]
          // console.log('eventTags: ', eventTags)
          // console.log('lastEventTags: ', lastEventTags)
        } else {
          // console.log('no event found from db')
          break
        }
      // for (eventId in eventTags) {
        addedAncestorCount++
      }
      return eventTags
    },

    scrollToMainEvent() {
      nextTick(() => {
        let mainRect = this.$refs.main?.$el.getBoundingClientRect()
        this.$emit('scroll-to-rect', mainRect)
      })
    },

    addEventChildren(event) {
      let existing = this.childrenSeen.get(event.id)
        if (existing) {
          return
        }
      this.interpolateEventMentions(event)
      this.childrenSeen.set(event.id, event)
      addToThread(this.childrenThreads, event)
    },

    addEventAncestors(event) {
      this.interpolateEventMentions(event)
      this.toEvent(event.id)
    },
  }
})
</script>

