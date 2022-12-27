<template>
  <q-page>
    <div id='profile-header'>
      <BaseUserCard
        v-if='hexPubkey'
        :pubkey='hexPubkey'
        class='user-card-header q-ma-sm'
        :header-mode='true'
        :show-following='true'
        :clickable='false'
      />
    </div>
    <q-tabs
      v-model="tab"
      dense
      outline
      align="left"
      active-color='accent'
      :breakpoint="0"
    >
      <q-tab name="posts" label='posts' />
      <q-tab name="follows" label='follows' />
      <q-tab name="followers" label='followers' />
      <q-tab name="relays" label='relays' />
    </q-tabs>
    <q-tab-panels v-model="tab" animated>
      <q-tab-panel name="posts" class='no-padding'>
        <q-form
          v-if='threads.length'
          class='q-pa-sm'
          @submit="search"
        >
          <q-input
            v-model="searchText"
            outlined
            rounded
            :label='$t("searchPosts")'
            dense
            autofocus
            color='secondary'
            class='no-padding'
            :loading='searching'
            @submit="search"
            @keypress.ctrl.enter="search"
          >
            <template #append>
              <BaseButtonClear :button-text='searchText' button-class='text-secondary' @clear='searchText=""'/>
              <q-btn
                text-color='secondary'
                class='q-pa-xs'
                icon="search"
                type="submit"
                unelevated
                :disable='searching'
                @click='search'
              />
            </template>
          </q-input>
        </q-form>
        <div v-if='searchResults.length'>
          <BasePostThread v-for="result in searchResults" :key="result[0].id" :events="result" @add-event='addEvent'/>
        </div>
        <div v-if='!searchText'>
          <BasePostThread v-for="thread in threads" :key="thread[0].id" :events="thread" @add-event='addEvent'/>
          <BaseButtonLoadMore :loading-more='loadingMore' :reached-end='reachedEnd' @click='loadMore' />
        </div>
      </q-tab-panel>

      <q-tab-panel name="follows" class='no-padding'>
        <div v-if="!follows">{{ $t('noFollows') }}</div>
        <div v-else class="flex column relative">
          <div class='q-pl-sm'>
            <BaseUserCard
              v-for="(pubkey) in follows"
              :key="pubkey"
              :pubkey="pubkey"
              :show-following='true'
            />
          </div>
        </div>
      </q-tab-panel>

      <q-tab-panel name="followers" class='no-padding'>
        <div v-if="!followers">{{ $t('noFollowers') }}</div>
        <div v-else class="flex column relative">
          <div class='q-pl-sm'>
            <BaseUserCard
              v-for="(pubkey) in Object.keys(followers)"
              :key="pubkey"
              :pubkey="pubkey"
              :show-following='true'
            />
          </div>
        </div>
      </q-tab-panel>

      <q-tab-panel name="relays" class='no-padding'>
        <div v-if="!relays">{{ $t('noRelays') }}</div>
        <div v-else class="flex column relative">
          <div class='q-pl-sm'>
            <BaseRelayRecommend
              v-for="(relay) in Object.keys(relays)"
              :key="relay"
              :url="relay"
              :list-view='true'
            />
          </div>
        </div>
      </q-tab-panel>
    </q-tab-panels>
  </q-page>
</template>

<script>
import { defineComponent } from 'vue'
import {debounce} from 'quasar'
import {metadataFromEvent} from '../utils/event'
import helpersMixin from '../utils/mixin'
import {addToThread} from '../utils/threads'
import BaseUserCard from 'components/BaseUserCard.vue'
import { dbUserProfile, streamUserProfile, dbStreamUserFollows, dbStreamUserFollowers, streamUserNotes, dbUserNotes, dbQuery } from '../query'
import BaseRelayRecommend from 'components/BaseRelayRecommend.vue'
import BaseButtonLoadMore from 'components/BaseButtonLoadMore.vue'
import BaseButtonClear from 'components/BaseButtonClear.vue'
import { createMetaMixin } from 'quasar'

const metaData = {
  // sets document title
  title: 'astral - profile',

  // meta tags
  meta: {
    description: { name: 'description', content: 'Nostr user profile' },
    keywords: { name: 'keywords', content: 'nostr decentralized social media' },
    equiv: { 'http-equiv': 'Content-Type', content: 'text/html; charset=UTF-8' },
  },
}

export default defineComponent({
  name: 'Profile',
  mixins: [helpersMixin, createMetaMixin(metaData)],

  components: {
    BaseUserCard,
    BaseRelayRecommend,
    BaseButtonLoadMore,
    BaseButtonClear,
  },

  data() {
    return {
      threads: [],
      eventsSet: new Set(),
      sub: {},
      tab: 'posts',
      followsEvent: null,
      follows: [],
      followers: [],
      relays: {},
      profilesUsed: new Set(),
      loadingMore: true,
      reachedEnd: false,
      searchText: '',
      searching: false,
      results: [],
      interval: null,
    }
  },

  computed: {
    searchResults() {
      if (this.searchText.length) return this.results
      return []
    },
    hexPubkey() {
      if (this.$route.params.pubkey) return this.bech32ToHex(this.$route.params.pubkey)
      return ''
    },
  },

  mounted() {
    if (this.hexPubkey.length) this.start()
    else {
      this.interval = setInterval(() => {
        if (!this.hexPubkey.length) return
        this.start()
        clearInterval(this.interval)
      }, 500)
    }
  },

  beforeUnmount() {
    this.stop()
  },

  methods: {
    async start() {
      // this.useProfile(this.hexPubkey)
      this.loadingMore = true
      let profile = await dbUserProfile(this.hexPubkey)
      if (profile) {
        let metadata = metadataFromEvent(profile)
        this.$store.commit('addProfileToCache', metadata)
        this.$store.dispatch('useNip05', {metadata})
      }
      this.sub.streamUserProfile = await streamUserProfile(this.hexPubkey, async event => {
        let metadata = metadataFromEvent(event)
        this.$store.commit('addProfileToCache', metadata)
        this.$store.dispatch('useNip05', {metadata})
      })

      let timer = setTimeout(async() => {
          this.loadMore()
        }, 4000)
      this.sub.streamUserNotes = await streamUserNotes(this.hexPubkey, event => {
        if (!timer) this.processUserNotes([event], this.threads)
        if (timer) clearTimeout(timer)
        timer = setTimeout(async() => {
          this.loadMore()
          clearTimeout(timer)
          timer = null
        }, 500)
      })
      this.sub.dbStreamUserFollows = await dbStreamUserFollows(this.hexPubkey, event => {
        if (this.followsEvent && event.created_at < this.followsEvent.created_at) return
        this.followsEvent = event
        this.follows = event.tags
          .filter(([t, v]) => t === 'p' && v)
          .map(([_, v]) => v)
        this.relays = event.content.length ? JSON.parse(event.content) : []
        if (this.follows.length)
          this.follows.forEach(pubkey => this.useProfile(pubkey))
      })
      this.sub.dbStreamUserFollowers = await dbStreamUserFollowers(this.hexPubkey, event => {
        this.followers[event.pubkey] = true
        this.useProfile(event.pubkey)
      })
    },

    stop() {
      if (this.sub.streamUserProfile) this.sub.streamUserProfile.cancel()
      if (this.sub.streamUserNotes) this.sub.streamUserNotes.cancel()
      if (this.sub.dbStreamUserFollows) this.sub.dbStreamUserFollows.cancel()
      if (this.sub.dbStreamUserFollowers) this.sub.dbStreamUserFollowers.cancel()
      this.profilesUsed.forEach(pubkey => this.$store.dispatch('cancelUseProfile', {pubkey}))
      if (this.interval) clearInterval(this.interval)
    },

    processUserNotes(events, threads, checkDups = true) {
      for (let event of events) {
        if (this.eventsSet.has(event.id) && checkDups) continue

        this.interpolateEventMentions(event)
        if (checkDups) this.eventsSet.add(event.id)
        addToThread(threads, event)
      }
    },

    useProfile(pubkey) {
      if (this.profilesUsed.has(pubkey)) return

      this.profilesUsed.add(pubkey)
      this.$store.dispatch('useProfile', {pubkey})
    },

    addEvent(event) {
      this.processUserNotes([event], this.threads)
    },

    async loadMore() {
      this.loadingMore = true
      let until = this.threads.length ? this.threads[this.threads.length - 1][0].created_at : Math.round(Date.now() / 1000)
      let notes = await dbUserNotes(this.hexPubkey, until, 50)
      if (notes.length < 50) this.reachedEnd = true
      let threads = []
      this.processUserNotes(notes, threads)
      this.threads = this.threads.concat(threads)
      this.loadingMore = false
    },

    async search() {
      // let query = `%${this.searchText.replace(' ', '%')}%`
      this.searching = true
      this.results = []
      let result = await dbQuery(`
        SELECT event
        FROM nostr
        WHERE json_extract(event,'$.kind') = 1 AND
          json_extract(event,'$.pubkey') = '${this.hexPubkey}' AND
          json_extract(event,'$.content') LIKE '%${this.searchText.replace(' ', '%')}%'
      `)
      let searchResults = result.map(row => JSON.parse(row.event))
      this.processUserNotes(searchResults, this.results, false)
      this.searching = false
      console.log('result ', searchResults)
    },


    debouncedSearch() {
      debounce(this.search(), 1000)
      console.log('debounced search')
    }
  }
})
</script>

<style lang='css' scoped>
.q-tabs {
  border-bottom: 1px solid var(--q-accent);
}
.q-tab-panels {
  background: var(--q-background);
}
</style>
