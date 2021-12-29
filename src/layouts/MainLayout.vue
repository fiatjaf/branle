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
        v-if="!!$store.state.keys.priv"
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

    <q-dialog v-model="initializeKeys" persistent>
      <q-card class="px-4 py-2">
        <q-card-section class="text-base">
          <div class="text-lg text-bold tracking-wide leading-relaxed py-2">
            Initial Key Setup
          </div>
          <p>
            Type your mnemonic seed from a previous Nostr account or generate a
            new one.
          </p>
          <p>
            You can also type a raw private key or just a public key for a
            watch-only setup.
          </p>
        </q-card-section>
        <q-card-section>
          <q-form @submit="proceed">
            <q-input
              v-model="key"
              autogrow
              label="BIP39 Seed Words, private key or public key"
              class="text-lg"
            />
            <q-toggle
              v-if="isKeyKey"
              v-model="watchOnly"
              label="This is a public key"
            />
            <div class="flex w-full mt-4 justify-between">
              <q-btn @click="generate">Generate</q-btn>
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
import {generateSeedWords, validateWords} from 'nostr-tools/nip06'

export default {
  name: 'MainLayout',
  mixins: [helpersMixin],

  data() {
    return {
      initializeKeys: true,
      watchOnly: false,
      key: null
    }
  },

  computed: {
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

  created: function () {
    if (this.$store.state.keys.pub !== '00') {
      this.$store.dispatch('launch')
      this.initializeKeys = false
    }
  },

  methods: {
    generate() {
      this.key = generateSeedWords()
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
