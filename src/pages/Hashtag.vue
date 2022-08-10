<template>
  <q-page>
    <div class="text-h5 text-bold q-py-md">{{'#' + this.$route.params.hashtagId}}</div>
    <q-separator color='accent' size='2px'/>
        <div>
          <BasePostThread v-for="thread in threads" :key="thread[0].id" :events="thread" @add-event='addEvent'/>
        </div>
  </q-page>
</template>

<script>
import { defineComponent } from 'vue'
import {pool} from '../pool'
import helpersMixin from '../utils/mixin'
import {addToThread} from '../utils/threads'
// import BaseUserCard from 'components/BaseUserCard.vue'

export default defineComponent({
  name: 'Hashtag',
  mixins: [helpersMixin],

  components: {
    // BaseUserCard,
  },

  data() {
    return {
      threads: [],
      eventsSet: new Set(),
      sub: null,
    }
  },

  activated() {
    this.listen()
  },

  deactivated() {
    if (this.sub) this.sub.unsub()
  },

  methods: {

    listen() {
      this.threads = []
      this.eventsSet = new Set()

      this.sub = pool.sub(
        {
          filter: [
            {
              '#hashtag': [this.$route.params.hashtagId.toLowerCase()],
              kinds: [1, 2]
            }
          ],
          cb: async (event, relay) => {
            switch (event.kind) {
              case 0:
                await this.$store.dispatch('addEvent', {event, relay})
                return

              case 1:
              case 2:
                if (this.eventsSet.has(event.id)) return

                this.interpolateEventMentions(event)
                this.eventsSet.add(event.id)
                addToThread(this.threads, event)
                return
            }
          }
        },
        'hashtag-browser'
      )
    },

    addEvent(event) {
      if (this.eventsSet.has(event.id)) return
      this.interpolateEventMentions(event)
      this.eventsSet.add(event.id)
      addToThread(this.threads, event)
    }
  }
})
</script>

<style lang='scss' scoped>
.q-tabs {
  border-bottom: 1px solid $accent
}
</style>
