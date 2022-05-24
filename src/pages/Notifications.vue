<template>
  <q-page>
    <div class="text-h5 text-bold q-py-md">notifications</div>

    <q-separator color='accent' size='2px'/>
    <q-infinite-scroll
      :disable="reachedEnd"
      @load="loadMore"
      :offset='150'
    >
      <div v-for="event in notifications" :key="event.id">
        <BasePost
          :event="event"
          :highlighted="$store.state.lastNotificationRead < event.created_at"
        />
          <!-- v-scroll-fire='markAsRead' -->
      </div>
      <template #loading>
        <div v-if='!reachedEnd' class='row justify-center q-my-md'>
          <q-spinner-orbit color="accent" size='md' />
        </div>
      </template>
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
      notificationsSet: new Set(),
      reachedEnd: false,
      listener: null,
      reading: false
    }
  },

  async activated() {
    if (this.$store.state.unreadNotifications) this.loadNew()

    this.listener = onNewMention(this.$store.state.keys.pub, async event => {
      if (this.notificationsSet.has(event.id)) return
      this.interpolateEventMentions(event)
      this.addNotificationEvent(event)
      this.notificationsSet.add(event.id)
    })
  },

  async deactivated() {
    this.$store.commit('haveReadNotifications')
    if (this.listener) this.listener.cancel()
  },

  methods: {
    async loadMore(_, done) {
      // if (this.notifications.length === 0) {
      //   this.reachedEnd = true
      //   done()
      //   return
      // }
          // this.notifications = await dbGetMentions(
    //   this.$store.state.keys.pub,
    //   40,
    //   0,
    //   Math.round(Date.now() / 1000)
    // )
    // if (this.notifications.length > 0) {
    //   this.reachedEnd = false
    // }

    // this.notifications.forEach(({pubkey}) => {
    //   this.$store.dispatch('useProfile', {pubkey, request: true})
    // })
      let until
      if (this.notifications.length) until = this.notifications[this.notifications.length - 1].created_at - 1
      else until = Math.round(Date.now() / 1000)
      let loadedNotifications = await dbGetMentions(
        this.$store.state.keys.pub,
        40,
        0,
        until
      )
      if (loadedNotifications.length < 40) {
        this.reachedEnd = true
      }
      loadedNotifications = loadedNotifications.filter(event => !this.notificationsSet.has(event.id))
      this.interpolateEventMentions(loadedNotifications)
      loadedNotifications.forEach(event => {
        this.notificationsSet.add(event.id)
        this.addNotificationEvent(event)
        this.$store.dispatch('useProfile', {pubkey: event.pubkey, request: true})
      })
      // this.notifications = this.notifications.concat(loadedNotifications)
      // will mark notifications as read after 3 * unread count seconds in the page
      if (
        this.notifications.length > 0 &&
        this.notifications[0].created_at > this.$store.state.lastNotificationRead
      ) {
        setTimeout(() => {
          this.$store.commit('haveReadNotifications')
        }, 3000 * this.notifications.filter(n => n.created_at > this.$store.state.lastNotificationRead).length)
      }
      done(this.reachedEnd)
    },

    async loadNew() {
      let until = Math.round(Date.now() / 1000)
      let since = this.$store.state.lastNotificationRead
      let loadedNotifications = await dbGetMentions(
        this.$store.state.keys.pub,
        40,
        since,
        until
      )
      loadedNotifications = loadedNotifications.filter(event => !this.notificationsSet.has(event.id))
      this.interpolateEventMentions(loadedNotifications)
      loadedNotifications.forEach(event => {
        this.notificationsSet.add(event.id)
        this.addNotificationEvent(event)
        this.$store.dispatch('useProfile', {pubkey: event.pubkey, request: true})
      })
      // this.notifications = loadedNotifications.concat(this.notifications)
          // will mark notifications as read after 3 * unread count seconds in the page
      if (
        this.notifications.length > 0 &&
        this.notifications[0].created_at > this.$store.state.lastNotificationRead
      ) {
        setTimeout(() => {
          this.$store.commit('haveReadNotifications')
        }, 3000 * this.notifications.filter(n => n.created_at > this.$store.state.lastNotificationRead).length)
      }
    },

    addNotificationEvent(event) {
      // manual sorting
      // for (let i = 0; i < this.notifications.length; i++) {
      //   if (event.created_at < this.notifications[i].created_at) {
      //     // the new event is older than the current index,
      //     // so we add it at the previous index
      //     this.notifications.splice(i, 0, event)
      //     return
      //   }
      // }
      if (this.notifications.length === 0) {
        this.notifications.push(event)
        return
      }

      if (this.notifications[this.notifications.length - 1].created_at >= event.created_at) {
        this.notifications.push(event)
        return
      }

      if (this.notifications[0].created_at <= event.created_at) {
        this.notifications.unshift(event)
        return
      }

      let insertIndex = this.notifications.findIndex((n, i, ns) =>
        n.created_at <= event.created_at &&
        (i === 0 || ns[i - 1].created_at >= event.created_at)
      )
      if (insertIndex >= 0) {
        this.notifications.splice(insertIndex, 0, event)
        return
      }

      // the event is the oldest, add to end
      this.notifications.push(event)
    }
  }
}
</script>
