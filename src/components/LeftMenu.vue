<template>
  <div class="hidden sm:flex w-1/4 justify-center px-8">
    <q-card flat no-box-shadow class="text-xl bg-inherit">
      <q-card-section class="flex justify-center">
        <q-img
          src="/bird.png"
          fit="scale-down"
          width="80px"
          @click="$router.push('/')"
        />
      </q-card-section>
      <q-list class="text-slate-700">
        <q-item v-ripple clickable to="/" active-class="">
          <q-item-section avatar>
            <q-icon name="home" color="secondary" />
          </q-item-section>

          <q-item-section
            :class="{
              'text-primary': $route.name === 'home'
            }"
          >
            Home
          </q-item-section>
        </q-item>

        <q-item v-ripple clickable to="/notifications" active-class="">
          <q-item-section avatar>
            <q-icon name="notifications" color="secondary" />
          </q-item-section>

          <q-item-section
            :class="{'text-primary': $route.name === 'notifications'}"
          >
            Notifications

            <q-badge v-if="unread" color="primary" floating transparent>
              {{ unread }}
            </q-badge>
          </q-item-section>
        </q-item>

        <q-item
          v-if="!!$store.state.keys.priv"
          v-ripple
          clickable
          to="/messages"
          active-class=""
        >
          <q-item-section avatar>
            <q-icon name="email" color="secondary" />
          </q-item-section>

          <q-item-section :class="{'text-primary': $route.name === 'messages'}">
            Messages
          </q-item-section>
        </q-item>

        <q-item
          v-ripple
          clickable
          :to="'/' + $store.state.keys.pub"
          active-class=""
        >
          <q-item-section avatar>
            <q-icon name="person" color="secondary" />
          </q-item-section>

          <q-item-section
            :class="{
              'text-primary':
                $route.name === 'profile' &&
                $route.params.pubkey === $store.state.keys.pub
            }"
          >
            Profile
          </q-item-section>
        </q-item>

        <q-item
          v-ripple
          clickable
          to="/follow"
          active-class=""
          class="lg:hidden"
        >
          <q-item-section avatar>
            <q-icon name="manage_search" color="secondary" />
          </q-item-section>

          <q-item-section
            :class="{
              'text-primary': $route.name === 'follow'
            }"
          >
            Search and Follows
          </q-item-section>
        </q-item>

        <q-item v-ripple clickable to="/settings" active-class="">
          <q-item-section avatar>
            <q-icon name="settings" color="secondary" />
          </q-item-section>

          <q-item-section :class="{'text-primary': $route.name === 'settings'}">
            Settings
          </q-item-section>
        </q-item>
      </q-list>
    </q-card>
  </div>
</template>

<script>
import helpersMixin from '../utils/mixin'
import {dbGetUnreadNotificationsCount, onNewMention} from '../db'

export default {
  name: 'LeftMenu',
  mixins: [helpersMixin],

  data() {
    return {
      unread: 0,
      listener: null,
      unwatch: null
    }
  },

  async mounted() {
    this.unread = await dbGetUnreadNotificationsCount(
      this.$store.state.keys.pub,
      this.$store.state.lastNotificationRead
    )

    this.listener = onNewMention(this.$store.state.keys.pub, async event => {
      this.unread = await dbGetUnreadNotificationsCount(
        this.$store.state.keys.pub,
        this.$store.state.lastNotificationRead
      )
    })

    this.unwatch = this.$store.watch(
      state => state.lastNotificationRead,
      async () => {
        this.unread = await dbGetUnreadNotificationsCount(
          this.$store.state.keys.pub,
          this.$store.state.lastNotificationRead
        )
      }
    )
  },

  async beforeUnmount() {
    if (this.listener) this.listener.cancel()
    if (this.unwatch) this.unwatch()
  }
}
</script>
