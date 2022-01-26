<template>
  <q-page class="px-4 py-6">
    <div class="text-xl">Notifications</div>

    <q-infinite-scroll
      class="my-6"
      :disable="reachedEnd"
      :offset="150"
      @load="loadMore"
    >
      <div v-for="event in notifications" :key="event.id">
        <q-separator />
        <Post
          :event="event"
          :highlighted="$store.state.lastNotificationRead < event.created_at"
        />
      </div>
    </q-infinite-scroll>
  </q-page>
</template>

<script>
import helpersMixin from '../utils/mixin'
import {dbGetMentions, onNewMention} from '../db'

export default {
  name: 'Notifications',
  mixins: [helpersMixin],

  data() {
    return {
      notifications: [],
      reachedEnd: false,
      listener: null,
      reading: false
    }
  },

  async mounted() {
    this.notifications = await dbGetMentions(
      this.$store.state.keys.pub,
      40,
      0,
      Math.round(Date.now() / 1000)
    )
    if (this.notifications.length > 0) {
      this.reachedEnd = false
    }

    this.notifications.forEach(({pubkey}) => {
      this.$store.dispatch('useProfile', {pubkey, request: true})
    })

    this.listener = onNewMention(this.$store.state.keys.pub, async event => {
      this.notifications.unshift(event)
      // we could trigger the timeout-to-mark-as-read here too, but we don't because
      // we don't want to accidentaly mark everything as read for a user that leaves
      // his screen open in this page and goes to the park
    })

    // will mark notifications as read after 5 seconds in the page
    if (
      this.notifications.length > 0 &&
      this.notifications[0].created_at > this.$store.state.lastNotificationRead
    ) {
      this.reading = true
      setTimeout(() => {
        if (this.reading) this.$store.commit('haveReadNotifications')
      }, 1400 * this.notifications.filter(n => n.created_at > this.$store.state.lastNotificationRead).length)
    }
  },

  async beforeUnmount() {
    this.reading = false
    if (this.listener) this.listener.cancel()
  },

  methods: {
    timeoutToMarkAsRead() {},

    async loadMore(_, done) {
      if (this.notifications.length === 0) {
        this.reachedEnd = true
        done()
        return
      }

      let loadedNotifications = await dbGetMentions(
        this.$store.state.keys.pub,
        40,
        0,
        this.notifications[this.notifications.length - 1].created_at - 1
      )
      if (loadedNotifications.length === 0) {
        this.reachedEnd = true
      }
      this.notifications = this.notifications.concat(loadedNotifications)
      done()
    }
  }
}
</script>
