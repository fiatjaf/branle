<template>
  <q-page>
    <div>
      <div class="text-h5 text-bold q-py-md full-width flex row justify-start">
        {{ $t('feed') }}
      </div>
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
        <q-tab name="bots" label='bots' />
      </q-tabs>
    </div>
    <BasePostThread v-for='(item, index) in items' :key='index' :events="item" class='full-width'/>
    <BaseButtonLoadMore
      :loading-more='loadingMore'
      label='load another day'
      @click='loadMore'
    />
  </q-page>
</template>

<script>
import { defineComponent } from 'vue'
import helpersMixin from '../utils/mixin'
import {addToThread} from '../utils/threads'
import {dbStreamFeed, dbUserFollows} from '../query'
import BaseButtonLoadMore from 'components/BaseButtonLoadMore.vue'

export default defineComponent({
  name: 'Feed',
  mixins: [helpersMixin],

  components: {
    BaseButtonLoadMore,
  },

  data() {
    return {
      listener: null,
      reachedEnd: false,
      feed: {
        follows: [],
        global: [],
        bots: []
      },
      feedSet: new Set(),
      bots: [],
      follows: [],
      botTracker: '29f63b70d8961835b14062b195fc7d84fa810560b36dde0749e4bc084f0f8952',
      loadingMore: true,
      tab: 'follows',
      sub: null,
      since: Math.round(Date.now() / 1000) - (3 * 24 * 60 * 60),
      profilesUsed: new Set(),
      // index: 0,
      active: false,
    }
  },

  computed: {
    items() {
      if (this.tab === 'follows') return this.feed.follows
      if (this.tab === 'global') return this.feed.global
      if (this.tab === 'bots') return this.feed.bots
      return []
    }
  },

  async mounted() {
    this.bots = await this.getFollows(this.botTracker)
    this.follows = await this.getFollows(this.$store.state.keys.pub)

    this.loadMore()

    if (this.follows.length === 0) {
      this.tab = 'global'
    }
  },

  activated() {
    // console.log('feed activated', this.index)
    // this.$refs.virtualScroll.refresh(this.index)
    this.active = true
  },

  async beforeUnmount() {
    if (this.listener) this.listener.cancel()
    if (this.sub) this.sub.cancel()
    this.sub = null
    this.profilesUsed.forEach(pubkey => this.$store.dispatch('cancelUseProfile', {pubkey}))
  },

  deactivated() {
    // console.log('feed deactivated', this.index)
    this.active = false
  },

  methods: {
    testScroll(event) {
      console.log('Feed testScroll', event, this.activated, this.index)
      if (this.activated) this.index = event.index
      // else this.$refs.virtualScroll.scrollTo(this.index, 'center-force')
    },
    async loadMore() {
      this.loadingMore = true

      let loadedFeed = {
        follows: [],
        global: [],
        bots: []
      }
      let timer = setTimeout(() => { this.loadingMore = false }, 1000)
      if (this.sub) {
        this.since = this.since - (24 * 60 * 60)
        this.sub.update(this.since)
        return
      }
      this.sub = await dbStreamFeed(this.since, event => {
        if (!timer) {
          this.processEvent(event, this.feed)
          return
        }
        clearTimeout(timer)
        timer = setTimeout(() => {
          for (let feed of Object.keys(this.feed)) {
            this.feed[feed] = this.feed[feed].concat(loadedFeed[feed])
          }
          timer = null
          this.loadingMore = false
        }, 300)
          this.loadingMore = false
        this.processEvent(event, loadedFeed)
      })
    },

    processEvent(event, feed = this.feed) {
      if (this.feedSet.has(event.id)) return
      this.feedSet.add(event.id)
      this.interpolateEventMentions(event)
      this.useProfile(event.pubkey)

      if (this.follows.includes(event.pubkey)) addToThread(feed.follows, Object.assign({}, event), 'feed', event.pubkey !== this.$store.state.keys.pub)
      if (this.bots.includes(event.pubkey)) addToThread(feed.bots, Object.assign({}, event), 'feed', event.pubkey !== this.$store.state.keys.pub)
      else addToThread(feed.global, Object.assign({}, event), 'feed', event.pubkey !== this.$store.state.keys.pub)
    },

    async getFollows(pubkey) {
      let event = await dbUserFollows(pubkey)
      if (!event) return []
      return event.tags
        .filter(([t, v]) => t === 'p' && v)
        .map(([_, v]) => v)
    },

    useProfile(pubkey) {
      if (this.profilesUsed.has(pubkey)) return

      this.profilesUsed.add(pubkey)
      this.$store.dispatch('useProfile', {pubkey})
    },

    // printDetails(details) {
    //   console.log('details', details)
    // },

    itemKey(item) {
      return item[0].id
    }
  }
})
</script>
<style lang='scss' scoped>
.q-tabs {
  border-bottom: 1px solid $accent
}

.q-page::-webkit-scrollbar {
  width: 0px;
}
</style>
