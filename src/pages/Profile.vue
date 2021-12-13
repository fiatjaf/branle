<template>
  <q-page>
    <q-btn
      flat
      color="white"
      icon="arrow_back"
      label="back"
      class="small-screen-only fixed-top-left q-ma-xs"
    />

    <div class="text-center">
      <strong class="text-h6 q-ma-sm">Profile</strong>
    </div>
    <br />
    <br />

    <div class="row">
      <div class="col-2">
        <q-avatar size="50px" round>
          <img round :src="$store.getters.avatar($route.params.pubkey)" />
        </q-avatar>
      </div>
      <div class="col-8">
        <p
          class="text-caption"
          style="width: 100%; word-break: break-all !important"
        >
          {{ $route.params.pubkey }}
        </p>
      </div>
    </div>

    <div class="q-pb-xl">
      <q-btn
        v-if="isFollowing"
        class="float-right q-mr-xs"
        round
        unelevated
        color="red"
        flat
        icon="cancel"
        size="sm"
        @click="unfollow"
      />
      <q-btn
        v-if="!isFollowing"
        class="float-right q-mr-xs"
        round
        unelevated
        color="primary"
        flat
        icon="add_circle"
        size="sm"
        @click="follow"
      />

      <q-btn
        class="float-right q-mr-xs"
        round
        flat
        :to="'/chat/' + $route.params.pubkey"
        unelevated
        color="primary"
        icon="message"
        size="sm"
      />
    </div>

    <Post v-for="event in events" :key="event.id" :event="event" />

    <q-infinite-scroll v-if="events.length > 20" :offset="250">
      <template #loading>
        <div class="row justify-center q-my-md">
          <q-spinner-dots color="primary" size="40px" />
        </div>
      </template>
    </q-infinite-scroll>
  </q-page>
</template>

<script>
import helpersMixin from '../utils/mixin'
import {pool} from '../pool'

export default {
  name: 'Profile',
  mixins: [helpersMixin],

  data() {
    return {
      events: [],
      eventsSet: new Set(),
      sub: null
    }
  },

  computed: {
    isFollowing() {
      return this.$store.state.following.includes(this.$route.params.pubkey)
    }
  },

  mounted() {
    this.$store.dispatch('useProfile')
  },

  watch: {
    '$route.params.pubkey'() {
      this.events = []
      this.eventsSet = new Set()

      this.sub = pool.sub({
        filter: [
          {
            authors: [this.$route.params.pubkey],
            kind: 0
          },
          {
            authors: [this.$route.params.pubkey],
            kind: 1
          }
        ],
        cb: async event => {
          switch (event.kind) {
            case 0:
              await this.$store.dispatch('addEvent')
              break

            case 1:
              if (this.eventsSet.has(event.id)) return
              this.eventsSet.add(event.id)

              // manual sorting
              // newer events first
              for (let i = 0; i < this.events.length; i++) {
                if (event.created_at > this.events[i].created_at) {
                  // the new event is newer than the current index,
                  // so we add it at the previous index
                  this.events.splice(i - 1, 0, event)
                }
              }
              break
          }
        }
      })
    }
  },

  beforeUnmount() {
    this.sub.unsub()
  },

  methods: {
    unfollow() {
      this.$store.commit('unfollow', this.$route.params.pubkey)
    },

    follow() {
      this.$store.commit('follow', this.$route.params.pubkey)
    }
  }
}
</script>
