<template>
  <q-page>
    <q-btn
      v-go-back.single
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
        @click="unFollow($route.params.pubkey)"
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
        @click="addPubFollow($route.params.pubkey)"
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

    <Post v-for="post in posts" :key="post.id" :post="post" />

    <q-dialog v-model="dialogReply" position="top">
      <Reply :post="dialogReply" />
    </q-dialog>
    <q-infinite-scroll v-if="posts.length > 20" :offset="250">
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
import {pool} from '../global'

export default {
  name: 'Profile',
  mixins: [helpersMixin],

  data() {
    return {
      posts: [],
      dialogReply: null,
      postsSet: new Set(),
      sub: null
    }
  },

  computed: {
    isFollowing() {
      return this.$store.state.following.includes(this.$route.params.pubkey)
    }
  },

  watch: {
    '$route.params.pubkey'() {
      this.posts = []
      this.postsSet = new Set()

      this.sub = pool.sub({
        filter: {
          author: this.$route.params.pubkey,
          kind: 1
        },
        cb: event => {
          if (this.postsSet.has(event.id)) return
          this.postsSet.add(event.id)
          this.posts.push(event)
        }
      })
    }
  },

  beforeUnmount() {
    this.sub.unsub()
  },

  methods: {
    unFollow() {
      this.$store.commit('unfollow', this.$route.params.pubkey)
      this.$router.push('/')
    },

    addPubFollow() {
      this.$store.commit('follow', this.$route.params.pubkey)
    }
  }
}
</script>
