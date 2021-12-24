<template>
  <q-layout class="bg-lime-100/70">
    <div class="flex">
      <LeftMenu />

      <div class="w-full sm:w-3/4 lg:w-2/4 pl-4">
        <q-page-container>
          <router-view />
        </q-page-container>
      </div>

      <div class="hidden lg:flex w-1/4">
        <Follow />
      </div>
    </div>

    <q-tabs
      class="
        w-full
        sm:hidden
        fixed
        bottom-0
        left-0
        right-0
        bg-lime-100
        text-secondary
      "
      active-class="px-0"
    >
      <q-route-tab
        icon="home"
        to="/"
        active-class=""
        :class="{'text-primary': $route.name === 'home'}"
      />
      <q-route-tab
        icon="notifications"
        to="/notifications"
        active-class=""
        :class="{'text-primary': $route.name === 'notifications'}"
      />
      <q-route-tab
        icon="email"
        to="/messages"
        active-class=""
        :class="{'text-primary': $route.name === 'messages'}"
      />
      <q-route-tab
        icon="person"
        :to="'/' + $store.state.keys.pub"
        active-class=""
        :class="{
          'text-primary':
            $route.name === 'profile' &&
            $route.params.pubkey === $store.state.keys.pub
        }"
      />
      <q-route-tab
        icon="manage_search"
        to="/follow"
        active-class=""
        :class="{'text-primary': $route.name === 'follow'}"
      />
      <q-route-tab
        icon="settings"
        to="/settings"
        active-class=""
        :class="{'text-primary': $route.name === 'settings'}"
      />
    </q-tabs>
  </q-layout>
</template>
<script>
import helpersMixin from '../utils/mixin'

export default {
  name: 'MainLayout',
  mixins: [helpersMixin],

  created: function () {
    this.$store.dispatch('launch')
  }
}
</script>
