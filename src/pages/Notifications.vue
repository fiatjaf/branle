<template>
  <q-page>
    <BaseHeader>{{ $t('notifications') }}</BaseHeader>
    <div>
      <div v-for="event in notifications" :key="event.id">
        <BasePost
          :event="event"
          :highlighted="$store.state.lastNotificationRead < event.created_at"
        />
      </div>
      <BaseButtonLoadMore :loading-more='loadingMore' :reached-end='reachedEnd' @click='loadMore' />
    </div>
  </q-page>
</template>

<script>
import helpersMixin from '../utils/mixin'
import { addSorted } from '../utils/helpers'
import {dbMentions, listenMentions} from '../query'
import { createMetaMixin } from 'quasar'
import BaseButtonLoadMore from 'components/BaseButtonLoadMore.vue'

const metaData = {
  // sets document title
  title: 'astral - notifications',

  // meta tags
  meta: {
    description: { name: 'description', content: 'Nostr notifications on astral' },
    keywords: { name: 'keywords', content: 'nostr decentralized social media' },
    equiv: { 'http-equiv': 'Content-Type', content: 'text/html; charset=UTF-8' },
  },
}

export default {
  name: 'Notifications',
  mixins: [helpersMixin, createMetaMixin(metaData)],
  components: {
    BaseButtonLoadMore,
  },

  data() {
    return {
      notifications: [],
      notificationsSet: new Set(),
      reachedEnd: false,
      sub: null,
      reading: false,
      profilesUsed: new Set(),
      loadingMore: true,
    }
  },

  async activated() {
    this.start()
  },

  async deactivated() {
    this.$store.commit('haveReadNotifications')
    if (this.sub) this.sub.cancel()
    this.profilesUsed.forEach(pubkey => this.$store.dispatch('cancelUseProfile', {pubkey}))
  },

  methods: {
    async start() {
      // this.useProfile(this.hexPubkey)
      this.loadingMore = true

      if (this.$store.state.unreadNotifications) this.loadNew()


      let timer = setTimeout(async() => {
          this.loadMore()
      }, 4000)

      this.sub = listenMentions(this.$store.state.keys.pub, async event => {
        if (!timer) await this.processNotifications([event])
        if (timer) clearTimeout(timer)
        timer = setTimeout(async() => {
          this.loadMore()
          clearTimeout(timer)
          timer = null
        }, 500)
        // if (loadedNotificationsFiltered.length === 0) return
        // this.notifications = loadedNotificationsFiltered.concat(this.notifications)
      })
      // this.sub.streamUserNotes = await streamUserNotes(this.hexPubkey, event => {
      //   if (!timer) this.processUserNotes([event], this.threads)
      //   if (timer) clearTimeout(timer)
      //   timer = setTimeout(async() => {
      //     this.loadMore()
      //     clearTimeout(timer)
      //     timer = null
      //   }, 500)
      // })
      this.highlightUnreadNotifications()
    },
    async loadMore() {
      let until
      if (this.notifications.length) until = this.notifications[this.notifications.length - 1].created_at - 1
      else until = Math.round(Date.now() / 1000)
      let loadedNotifications = await dbMentions(
        this.$store.state.keys.pub,
        40,
        until
      )
      // if (loadedNotifications.length < 40) {
      //   this.reachedEnd = true
      // }

      await this.processNotifications(loadedNotifications)
      // this.notifications.push(...loadedNotificationsFiltered)
      // will mark notifications as read after 3 * unread count seconds in the page
      this.highlightUnreadNotifications()
      this.loadingMore = false
    },

    async loadNew() {
      let loadedNotifications = await dbMentions(
        this.$store.state.keys.pub,
        40
      )
      await this.processNotifications(loadedNotifications)
      // this.notifications = loadedNotificationsFiltered.concat(this.notifications)
      // will mark notifications as read after 3 * unread count seconds in the page
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
        // notificationsFiltered.push(event)
        addSorted(this.notifications, event, (a, b) => a.created_at < b.created_at)
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
