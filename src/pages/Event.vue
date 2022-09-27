<template>

  <q-page ref='page'>
    <div class="text-h5 text-bold q-py-md">{{ $t('thread') }}</div>
    <q-separator color='accent' size='2px'/>
    <div v-if="ancestorsCompiled.length || rootAncestor">
      <BasePostThread :events="ancestorsCompiled" is-ancestors @add-event='addEventAncestors'/>
    </div>

    <q-item ref="main" class='no-padding column'>
      <BasePost
        v-if="event"
        :event='event'
        :highlighted='true'
        :position='ancestors.length ? "last" : "standalone"'
        @add-event='processChildEvent'
      />
      <div v-else>
        {{ $t('event') }} {{ $route.params.eventId }}
      </div>
    <BaseRelayList v-if="event?.seen_on?.length" :event='event'/>
    </q-item>

    <q-separator color='accent' size='2px'/>

    <div v-if="childrenThreadsFiltered.length">
      <div class="text-h6 text-bold">{{ $t('replies') }}</div>
      <div v-for="(thread) in childrenThreadsFiltered" :key="thread[0].id">
        <BasePostThread :events="thread" @add-event='processChildEvent'/>
      </div>
    </div>
    <div style='min-height: 70vh;'/>
  </q-page>
</template>

<script>
import { defineComponent, nextTick } from 'vue'
import {dbStreamEvent, dbStreamTagKind} from '../query'
import helpersMixin from '../utils/mixin'
import {addToThread} from '../utils/threads'
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
      ancestorsSeen: new Map(),
      ancestorIds: [],
      rootAncestor: null,
      event: null,
      childrenThreads: [],
      childrenSet: new Set(),
      sub: {},
      profilesUsed: new Set(),
    }
  },

  computed: {
    childrenThreadsFiltered() {
      return this.childrenThreads.filter(thread => thread[0].interpolated.replyEvents.includes(this.$route.params.eventId))
    },
    ancestorsCompiled() {
      if (!this.rootAncestor) return this.ancestors
      if (this.ancestors.length && this.rootAncestor && this.ancestors[0].id === this.rootAncestor.id) return this.ancestors
      return [this.rootAncestor].concat(this.ancestors)
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
      this.sub.event = await dbStreamEvent(this.$route.params.eventId, event => {
        let getAncestorsChildren = false
        if (!this.event) getAncestorsChildren = true
        this.interpolateEventMentions(event)
        this.event = null
        this.event = event
        if (getAncestorsChildren) {
          if (this.event.interpolated.replyEvents.length) this.subRootAncestor()
          this.subAncestorsChildren()
        }
        this.useProfile(event.pubkey)
      }, true)
      this.subAncestorsChildren()
    },

    stop() {
      this.replying = false
      if (this.sub.event) this.sub.event.cancel()
      if (this.sub.ancestorsChildren) this.sub.ancestorsChildren.cancel()
      if (this.sub.rootAncestor) this.sub.rootAncestor.cancel()
      this.profilesUsed.forEach(pubkey => this.$store.dispatch('cancelUseProfile', {pubkey}))
    },

    async subRootAncestor() {
      this.sub.rootAncestor = await dbStreamEvent(this.event.interpolated.replyEvents[0], event => {
        this.processAncestorEvent(event)
        this.sub.rootAncestor.cancel()
      })
    },

    async subAncestorsChildren() {
      let tags = this.event?.interpolated?.replyEvents?.length ? [this.$route.params.eventId, this.event.interpolated.replyEvents[0]] : [this.$route.params.eventId]

      if (this.sub.ancestorsChildren) this.sub.ancestorsChildren.update('e', tags, 1)
      else this.sub.ancestorsChildren = await dbStreamTagKind('e', tags, 1, event => {
        if (this.event && event.created_at < this.event.created_at) {
          this.processAncestorEvent(event)
          return
        }
        this.processChildEvent(event)
        return
      })
    },

    processAncestorEvent(event) {
      let currAncestor = this.ancestors.length ? this.ancestors[this.ancestors.length - 1] : this.event
      if (currAncestor.interpolated.replyEvents.length === 0) return

      let existing = this.ancestorsSeen.get(event.id)
      if (existing) return

      this.interpolateEventMentions(event)
      this.ancestorsSeen.set(event.id, event)
      if (this.event?.interpolated?.replyEvents?.[0] === event.id) this.rootAncestor = event

      let prevAncestorId = currAncestor.interpolated.replyEvents[currAncestor.interpolated.replyEvents.length - 1]
      if (prevAncestorId === event.id) {
        let prevAncestor = event
        while (prevAncestor) {
          this.ancestors = [prevAncestor].concat(this.ancestors)
          this.scrollToMainEvent()
          this.useProfile(prevAncestor.pubkey)
          currAncestor = prevAncestor
          prevAncestorId = currAncestor.interpolated.replyEvents[currAncestor.interpolated.replyEvents.length - 1]
          prevAncestor = this.ancestorsSeen.get(prevAncestorId)
        }
      }
    },

    processChildEvent(event) {
      if (event.id === this.$route.params.eventId) return
      if (this.childrenSet.has(event.id)) return

      this.childrenSet.add(event.id)
      this.useProfile(event.pubkey)
      this.interpolateEventMentions(event)
      addToThread(this.childrenThreads, event, '', event.pubkey !== this.$store.state.keys.pub)
    },

    scrollToMainEvent() {
      nextTick(() => {
        let mainRect = this.$refs.main?.$el.getBoundingClientRect()
        this.$emit('scroll-to-rect', mainRect)
      })
    },

    addEventAncestors(event) {
      this.interpolateEventMentions(event)
      this.toEvent(event.id)
    },

    useProfile(pubkey) {
      if (this.profilesUsed.has(pubkey)) return

      this.profilesUsed.add(pubkey)
      this.$store.dispatch('useProfile', {pubkey})
    },
  }
})
</script>

