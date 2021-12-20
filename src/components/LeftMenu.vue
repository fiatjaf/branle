<template>
  <q-dialog v-model="dialogPublish">
    <Publish />
  </q-dialog>

  <div class="hidden sm:flex w-1/4 justify-center px-8">
    <q-card flat no-box-shadow class="text-xl">
      <q-card-section class="flex justify-center">
        <q-img src="/bird.png" fit="scale-down" width="80px" />
      </q-card-section>
      <q-list class="text-slate-700">
        <q-item v-ripple clickable :to="'/'" active-class="">
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

        <q-item v-ripple clickable :to="'/notifications'" active-class="">
          <q-item-section avatar>
            <q-icon name="notifications" color="secondary" />
          </q-item-section>

          <q-item-section
            :class="{'text-primary': $route.name === 'notifications'}"
          >
            Notifications

            <q-badge
              v-if="notifications.length"
              color="primary"
              floating
              transparent
            >
              {{ notifications.length }}
            </q-badge>
          </q-item-section>
        </q-item>

        <q-item v-ripple clickable :to="'/messages'" active-class="">
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

        <q-item v-ripple clickable :to="'/settings'" active-class="">
          <q-item-section avatar>
            <q-icon name="settings" color="secondary" />
          </q-item-section>

          <q-item-section :class="{'text-primary': $route.name === 'settings'}">
            Settings
          </q-item-section>
        </q-item>
      </q-list>

      <div class="flex justify-center">
        <q-btn
          rounded
          unelevated
          color="primary"
          size="md"
          label="Publish"
          class="mx-2 my-4 py-2 px-4 w-full"
          @click="dialogPublish = true"
        ></q-btn>
      </div>
    </q-card>
  </div>
</template>

<script>
import helpersMixin from '../utils/mixin'

export default {
  name: 'LeftMenu',
  mixins: [helpersMixin],

  data() {
    return {
      notifications: [],
      dialogPublish: false
    }
  }
}
</script>
