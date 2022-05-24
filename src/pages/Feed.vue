<template>
  <q-page >
    <div
      class='home-feed-header flex column'
    >
      <div class="text-h5 text-bold q-py-md">feed</div>
      <BasePostEntry />
    </div>
    <!-- <q-separator color='accent' size='2px'/> -->
    <q-tabs
      v-model="tab"
      dense
      outline
      align="left"
      active-color='accent'
      :breakpoint="0"
    >
      <q-tab name="follows" label='follows' />
      <q-tab name="global" label='global' />
    </q-tabs>
    <q-tab-panels v-model="tab" animated>
      <q-tab-panel name="follows" class='no-padding'>
        <div>
          <q-virtual-scroll :items='followsFeed' virtual-scroll-item-size="110" ref='followsFeedScroll'>
            <template #default="{ item }">
              <BasePostThread :key="item[0].id" :events="item" @add-event='addEventFollows'/>
            </template>
          </q-virtual-scroll>
          <div v-if='followsFeed.length'>
            <q-separator color='accent'/>
            <q-btn-group
            flat
            spread
            dense
            text-color="accent"
            >
              <q-btn
                dense
                :loading='loadingMore'
                flat
                color="accent"
                class='text-weight-light'
                style='letter-spacing: .1rem;'
                :label='reachedEnd ? "reached end" : "load 200 more"'
                :disable='reachedEnd'
                @click="loadMoreFollowsFeed"
              >
                <template #loading>
                  <div class='row justify-center q-my-md'>
                    <q-spinner-orbit color="accent" size='md' />
                  </div>
                </template>
              </q-btn>
            </q-btn-group>
            <q-separator color='accent'/>
          </div>
        </div>
      </q-tab-panel>

      <q-tab-panel name="global" class='no-padding'>
        <div>
          <q-virtual-scroll :items='globalFeed' virtual-scroll-item-size="110" ref='globalFeedScroll'>
            <template #default="{ item }">
              <BasePostThread :key="item[0].id" :events="item" @add-event='addEventGlobal'/>
            </template>
          </q-virtual-scroll>
          <div v-if='globalFeed.length'>
            <q-separator color='accent'/>
            <q-btn-group
            flat
            spread
            dense
            text-color="accent"
            >
              <q-btn
                dense
                :loading='loadingMore'
                flat
                color="accent"
                class='text-weight-light'
                style='letter-spacing: .1rem;'
                label='load another day'
                @click="loadMoreGlobalFeed"
              >
                <template #loading>
                  <div class='row justify-center q-my-md'>
                    <q-spinner-orbit color="accent" size='md' />
                  </div>
                </template>
              </q-btn>
            </q-btn-group>
            <q-separator color='accent'/>
          </div>
        </div>
      </q-tab-panel>
    </q-tab-panels>
  </q-page>
</template>

<script>
import {pool} from '../pool'
import helpersMixin from '../utils/mixin'
import {addToThread} from '../utils/threads'
import {dbGetHomeFeedNotes, onNewHomeFeedNote} from '../db'

export default {
  name: 'Feed',
  mixins: [helpersMixin],

  data() {
    return {
      listener: null,
      reachedEnd: false,
      followsFeed: [],
      followsFeedSet: new Set(),
      globalFeed: [],
      globalFeedSet: new Set(),
      loadingMore: false,
      tab: 'follows',
      sub: null,
      since: null,
    }
  },

  async mounted() {
    this.loadMoreFollowsFeed()
    this.loadMoreGlobalFeed()
    // let notes = await dbGetHomeFeedNotes(200)
    // this.interpolateEventMentions(notes)
    // if (notes.length === 0) this.tab = 'global'
    // if (notes.length > 0) this.reachedEnd = false

    // for (let i = notes.length - 1; i >= 0; i--) {
    //   addToThread(this.followsFeed, notes[i])
    //   this.followsFeedSet.add(notes[i].id)
    // }

    this.listener = onNewHomeFeedNote(event => {
      if (this.followsFeedSet.has(event.id)) return

      this.followsFeedSet.add(event.id)
      this.interpolateEventMentions(event)
      addToThread(this.followsFeed, event, 'feed')
    })
  },

  async beforeUnmount() {
    if (this.listener) this.listener.cancel()
    if (this.sub) this.sub.unsub()
  },

  methods: {
    async loadMoreFollowsFeed() {
      this.loadingMore = true

      let until = this.followsFeed.length === 0
        ? Math.round(Date.now() / 1000)
        : Math.min.apply(
          Math,
          this.followsFeed.flat().map(event => event.created_at)
        ) - 1
      let loadedNotes = await dbGetHomeFeedNotes(
        200,
        until
      )
      // loadedNotes = loadedNotes.filter(event => !this.followsFeedSet.has(event.id))
      if (loadedNotes.length < 200) {
        this.reachedEnd = true
        if (this.followsFeed.length === 0) {
          this.tab = 'global'
        }
      }
      this.interpolateEventMentions(loadedNotes)

      let loadedThreads = []
      for (let i = loadedNotes.length - 1; i >= 0; i--) {
        let event = loadedNotes[i]
        if (this.followsFeedSet.has(event.id)) continue
        this.followsFeedSet.add(event.id)
        addToThread(loadedThreads, event, 'feed')
      }
      this.followsFeed.push(...loadedThreads)
      this.loadingMore = false
    },

    // listenGlobalFeed() {
    //   this.globalFeed = []
    //   this.globalFeedSet = new Set()

    //   this.sub = pool.sub(
    //     {
    //       filter: [
    //         {
    //           kinds: [1, 2],
    //           since: Math.floor(Date.now() / 1000) - 86400,
    //           until: Math.floor(Date.now() / 1000)
    //         }
    //       ],
    //       cb: async (event, relay) => {
    //         if (this.globalFeedSet.has(event.id)) return

    //         // this.$store.dispatch('useProfile', {
    //         //   pubkey: event.pubkey,
    //         //   request: true
    //         // })
    //         this.interpolateEventMentions(event)
    //         this.globalFeedSet.add(event.id)
    //         addToThread(this.globalFeed, event, 'feed')
    //         return
    //       }
    //     },
    //     'global-feed'
    //   )
    // },

    loadMoreGlobalFeed() {
      this.loadingMore = true
      if (this.sub) this.sub.unsub()

      if (!this.since) this.since = Math.floor(Date.now() / 1000) - 86400
      else this.since -= 86400

      this.sub = pool.sub(
        {
          filter: [
            {
              kinds: [1, 2],
              since: this.since,
              until: this.since + 86400,
            }
          ],
          cb: async (event, relay) => {
            if (this.globalFeedSet.has(event.id)) return

            // this.$store.dispatch('useProfile', {
            //   pubkey: event.pubkey,
            //   request: true
            // })
            this.interpolateEventMentions(event)
            this.globalFeedSet.add(event.id)
            addToThread(this.globalFeed, event, 'feed')
            return
          }
        },
        'global-feed'
      )

      this.loadingMore = false
    },

    addEventFollows(event) {
      if (this.followsFeedSet.has(event.id)) return
      this.interpolateEventMentions(event)
      this.followsFeedSet.add(event.id)
      addToThread(this.followsFeed, event, 'feed')
    },

    addEventGlobal(event) {
      if (this.globalFeedSet.has(event.id)) return
      this.interpolateEventMentions(event)
      this.globalFeedSet.add(event.id)
      addToThread(this.globalFeed, event, 'feed')
    },
  }
}
</script>
<style lang='scss' scoped>
.home-feed-header {
  margin: 0;
}
.q-tabs {
  border-bottom: 1px solid $accent
}
</style>
