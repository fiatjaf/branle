<template>
  <q-layout>
    <div class="flex">
      <div class="hidden sm:flex w-1/4 justify-center px-8">
        <q-card flat no-box-shadow class="text-xl bg-inherit">
          <q-card-section class="flex justify-center">
            <q-img
              :src="icon"
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

                <q-badge
                  v-if="$store.state.unreadNotifications"
                  color="primary"
                  floating
                  transparent
                >
                  {{ $store.state.unreadNotifications }}
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

              <q-item-section
                :class="{'text-primary': $route.name === 'messages'}"
              >
                Messages

                <q-badge
                  v-if="$store.getters.unreadChats"
                  color="primary"
                  floating
                  transparent
                >
                  {{ $store.getters.unreadChats }}
                </q-badge>
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

              <q-item-section
                :class="{'text-primary': $route.name === 'settings'}"
              >
                Settings
              </q-item-section>
            </q-item>
          </q-list>
        </q-card>
      </div>

      <div class="w-full sm:w-3/4 lg:w-2/4 pl-4">
        <q-page-container v-if="$store.state.keys.pub">
          <router-view />
        </q-page-container>
      </div>

      <div class="hidden lg:flex w-1/4">
        <Follow />
      </div>
    </div>

    <q-tabs
      class="w-full sm:hidden fixed bottom-0 left-0 right-0 text-secondary"
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
      >
        <q-badge
          v-if="$store.state.unreadNotifications"
          color="primary"
          floating
          transparent
        >
          {{ $store.state.unreadNotifications }}
        </q-badge>
      </q-route-tab>
      <q-route-tab
        v-if="!!$store.state.keys.priv"
        icon="email"
        to="/messages"
        active-class=""
        :class="{'text-primary': $route.name === 'messages'}"
      >
        <q-badge
          v-if="$store.getters.unreadChats"
          color="primary"
          floating
          transparent
        >
          {{ $store.getters.unreadChats }}
        </q-badge>
      </q-route-tab>
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

    <q-dialog v-model="initializeKeys" persistent>
      <q-card class="px-4 py-2">
        <q-card-section class="text-base">
          <div class="text-lg text-bold tracking-wide leading-relaxed py-2">
            Initial Key Setup
          </div>
          <div class="mb-2">
            Type your private key from a previous Nostr account or generate a
            new one.
          </div>
          <div>
            You can also type just a public key and later sign events manually
            or using a Nostr-capable browser extension.
          </div>

          <q-form @submit="proceed">
            <q-input
              v-model="key"
              autogrow
              autofocus
              label="Private key or public key"
              class="text-lg"
            />
            <q-toggle
              v-if="isKeyKey"
              v-model="watchOnly"
              label="This is a public key"
            />
            <div class="flex w-full mt-4 justify-between">
              <q-btn @click="generate">Generate</q-btn>
              <q-btn
                v-if="hasExtension && !isKeyValid"
                @click="getFromExtension"
                >Use Public Key from Extension</q-btn
              >
              <q-btn v-if="isKeyValid" color="primary" @click="proceed"
                >Proceed</q-btn
              >
            </div>
          </q-form>
        </q-card-section>
      </q-card>
    </q-dialog>
  </q-layout>
</template>
<script>
import helpersMixin from '../utils/mixin'
import {validateWords} from 'nostr-tools/nip06'
import {generatePrivateKey} from 'nostr-tools'

export default {
  name: 'MainLayout',
  mixins: [helpersMixin],

  data() {
    return {
      initializeKeys: true,
      watchOnly: false,
      key: null,
      hasExtension: false
    }
  },

  computed: {
    icon() {
      return document.getElementById('icon').href
    },

    isKeyKey() {
      if (this.isKey(this.key)) return true
      return false
    },

    isKeyValid() {
      if (this.isKeyKey) return true
      if (validateWords(this.key?.toLowerCase())) return true
      return false
    }
  },

  async created() {
    if (this.$store.state.keys.pub) {
      // keys already set up
      this.$store.dispatch('launch')
      this.initializeKeys = false
    } else {
      // keys not set up, offer the option to try to get a pubkey from window.nostr
      setTimeout(() => {
        if (window.nostr) {
          this.hasExtension = true
        }
      }, 1000)
    }
  },

  methods: {
    async getFromExtension() {
      try {
        this.key = await window.nostr.getPublicKey()
        this.watchOnly = true
      } catch (err) {
        this.$q.notify({
          message: `Failed to get a public key from a Nostr extension: ${err}`,
          color: 'warning'
        })
      }
    },

    generate() {
      this.key = generatePrivateKey()
      this.watchOnly = false
    },

    proceed() {
      let key = this.key?.toLowerCase()

      var keys = {}
      if (validateWords(key)) {
        keys.mnemonic = key
      } else if (this.isKey(key)) {
        if (this.watchOnly) keys.pub = key
        else keys.priv = key
      } else {
        console.warn('Proceed called with invalid key', key)
      }

      this.$store.dispatch('initKeys', keys)
      this.$store.dispatch('launch')
      this.initializeKeys = false
      this.$router.push({
        name: 'settings',
        params: {showKeys: true}
      })
    },

    isKey(key) {
      return key?.toLowerCase()?.match(/^[0-9a-f]{64}$/)
    }
  }
}
</script>
