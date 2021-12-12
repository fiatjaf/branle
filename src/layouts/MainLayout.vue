<template>
  <q-layout>
    <q-dialog v-model="dialogPublish">
      <Publish />
    </q-dialog>

    <div class="flex">
      <div class="hidden sm:flex w-1/4 justify-center px-8">
        <q-card flat no-box-shadow class="text-xl">
          <q-card-section class="flex justify-center">
            <q-img src="/bird.png" fit="scale-down" width="80px" />
          </q-card-section>
          <q-list class="text-secondary">
            <q-item
              v-ripple
              clickable
              :active="$route.name === 'home'"
              active-class="my-menu-link"
              :to="'/'"
            >
              <q-item-section avatar>
                <q-icon name="home"></q-icon>
              </q-item-section>

              <q-item-section>Home</q-item-section>
            </q-item>

            <q-item
              v-ripple
              clickable
              :active="$route.name === 'messages'"
              active-class="my-menu-link"
              :to="'/messages'"
            >
              <q-item-section avatar>
                <q-icon name="email"></q-icon>
              </q-item-section>

              <q-item-section>Messages</q-item-section>
            </q-item>

            <q-item
              v-if="$store.getters.disabled"
              :disabled="$store.getters.disabled"
            >
              <q-item-section avatar>
                <q-icon name="settings"></q-icon>
              </q-item-section>

              <q-item-section>Settings</q-item-section>
            </q-item>
            <q-item
              v-else
              v-ripple
              clickable
              :active="$route.name === 'settings'"
              active-class="my-menu-link"
              :to="'/settings'"
            >
              <q-item-section avatar>
                <q-icon name="settings"></q-icon>
              </q-item-section>

              <q-item-section>Settings</q-item-section>
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

          <div class="break-all text-sm font-mono my-5 text-secondary">
            {{ $store.state.keys.pub }}
          </div>
        </q-card>
      </div>

      <div class="w-full sm:w-3/4 lg:w-2/4">
        <q-card flat bordered class="no-border-radius">
          <q-card-section>
            <q-page-container>
              <router-view />
            </q-page-container>
          </q-card-section>
        </q-card>
      </div>

      <div class="hidden lg:flex w-1/4">
        <q-card>
          <q-card-section v-if="$store.state.following.length">
            <h6 class="q-ma-none">Following</h6>
            <q-list>
              <q-item
                v-for="(_, pubkey) in $store.state.following"
                :key="pubkey"
                v-ripple
                clickable
                @click="toProfile(pubkey)"
              >
                <q-item-section avatar>
                  <q-avatar round>
                    <img :src="$store.getters.avatar(pubkey)" />
                  </q-avatar>
                </q-item-section>

                <q-item-section>
                  {{ $store.getters.displayName(pubkey) }}
                </q-item-section>
              </q-item>
            </q-list>
          </q-card-section>
        </q-card>
      </div>
    </div>
  </q-layout>
</template>
<script>
import {copyToClipboard} from 'quasar'
import helpersMixin from '../utils/mixin'

export default {
  name: 'MainLayout',
  mixins: [helpersMixin],

  data() {
    return {
      dialogGenerate: false,
      dialogPublish: false,
      addPubKey: ''
    }
  },
  created: function () {
    this.$store.dispatch('launch')
  },
  methods: {
    async copyPubKey() {
      try {
        await copyToClipboard(this.$store.state.keys.pub)
        this.$q.notify({
          message: 'COPIED'
        })
      } catch (err) {
        this.$q.notify({type: 'negative', message: 'FAILED'})
      }
    }
  }
}
</script>
