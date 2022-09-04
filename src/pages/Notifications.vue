<template>
  <q-page>
    <div class="text-h5 text-bold q-py-md">{{ $t('notifications') }}</div>

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
import {dbMentions, streamMentions} from '../query'

export default {
  name: 'Notifications',
  mixins: [helpersMixin],

  data() {
    return {
      notifications: [],
      notificationsSet: new Set(),
      reachedEnd: false,
      sub: null,
      reading: false,
      profilesUsed: new Set(),
    }
  },

  async activated() {
    if (this.$store.state.unreadNotifications) this.loadNew()

    this.sub = streamMentions(this.$store.state.keys.pub, async event => {
      let loadedNotificationsFiltered = await this.processNotifications([event])
      if (loadedNotificationsFiltered.length === 0) return
      this.notifications = loadedNotificationsFiltered.concat(this.notifications)
      this.highlightUnreadNotifications()
    })
  },

  async deactivated() {
    this.$store.commit('haveReadNotifications')
    if (this.sub) this.sub.cancel()
    this.profilesUsed.forEach(pubkey => this.$store.dispatch('cancelUseProfile', {pubkey}))
  },

  methods: {
    async loadMore(_, done) {
      let until
      if (this.notifications.length) until = this.notifications[this.notifications.length - 1].created_at - 1
      else until = Math.round(Date.now() / 1000)
      let loadedNotifications = await dbMentions(
        this.$store.state.keys.pub,
        40,
        until
      )
      if (loadedNotifications.length < 40) {
        this.reachedEnd = true
      }

      let loadedNotificationsFiltered = await this.processNotifications(loadedNotifications)
      this.notifications = this.notifications.concat(loadedNotificationsFiltered)
      // will mark notifications as read after 3 * unread count seconds in the page
      this.highlightUnreadNotifications()
      done(this.reachedEnd)
    },

    async loadNew() {
      let loadedNotifications = await dbMentions(
        this.$store.state.keys.pub,
        40
      )
      let loadedNotificationsFiltered = await this.processNotifications(loadedNotifications)
      this.notifications = loadedNotificationsFiltered.concat(this.notifications)
      // will mark notifications as read after 3 * unread count seconds in the page
      this.highlightUnreadNotifications()
    },

    processNotifications(notifications) {
      let notificationsFiltered = []
      for (let i = 0; i < notifications.length; i++) {
      // await notifications.forEach(async (event) => {
        let event = notifications[i]
        if (this.notificationsSet.has(event.id)) continue

        this.notificationsSet.add(event.id)
        this.interpolateEventMentions(event)
        // if (event.tags.filter(([t, v]) => t === 'e' && v).length) this.processTaggedEvents(event)
        notificationsFiltered.push(event)
        this.useProfile(event.pubkey)
      }
      return notificationsFiltered
    },

    highlightUnreadNotifications() {
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
    },

    useProfile(pubkey) {
      if (this.profilesUsed.has(pubkey)) return

      this.profilesUsed.add(pubkey)
      this.$store.dispatch('useProfile', {pubkey})
    },
  }
}
</script>
