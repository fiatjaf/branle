<template>
  <q-page class="px-4 py-6">
    <div class="text-xl">Settings</div>

    <q-form class="my-8 q-gutter-md" @submit="setMetadata">
      <div class="text-lg p-4">Profile</div>
      <q-input v-model="metadata.name" filled type="text" label="Name">
        <template #before>
          <q-icon name="alternate_email" />
        </template>
      </q-input>
      <q-input
        v-model="metadata.about"
        filled
        autogrow
        type="text"
        label="About (in 150 chars)"
        maxlength="150"
      />
      <q-input
        v-model="metadata.picture"
        filled
        type="text"
        label="Picture URL"
        maxlength="150"
      >
        <template #after>
          <q-avatar v-if="metadata.picture" rounded class="mx-3">
            <img :src="metadata.picture" />
          </q-avatar>
        </template>
      </q-input>
      <q-btn label="Save" type="submit" color="primary" />
    </q-form>
    <q-separator />
    <div class="my-8">
      <div class="text-lg p-4">Relays</div>
      <q-list class="mb-3">
        <q-item v-for="(opts, url) in $store.state.relays" :key="url">
          <q-item-section class="opacity-75">
            <div class="flex-inline">
              <q-btn
                round
                flat
                color="negative"
                icon="cancel"
                size="xs"
                @click="removeRelay(url)"
              />
              {{ url }}
            </div>
          </q-item-section>
          <q-item-section side>
            <div class="flex-inline">
              <span
                class="cursor-pointer tracking-wide"
                :class="{'font-bold': opts.read, 'text-secondary': opts.read}"
                @click="setRelayOpt(url, 'read', !opts.read)"
              >
                read
              </span>
              <span
                class="cursor-pointer tracking-wide"
                :class="{'font-bold': opts.write, 'text-secondary': opts.write}"
                @click="setRelayOpt(url, 'write', !opts.write)"
              >
                write
              </span>
            </div>
          </q-item-section>
        </q-item>
      </q-list>
      <q-form @submit="addRelay">
        <q-input v-model="addingRelay" class="mx-3" filled label="Add a relay">
          <template #append>
            <q-btn
              label="Add"
              type="submit"
              color="primary"
              class="ml-3"
              @click="addRelay"
            />
          </template>
        </q-input>
      </q-form>
    </div>

    <q-separator />

    <div class="my-8">
      <q-btn label="Delete Local Data" color="negative" @click="hardReset" />
      <q-btn
        class="q-ml-md"
        label="View your keys"
        color="primary"
        @click="keysDialog = true"
      />
    </div>

    <q-dialog v-model="keysDialog">
      <q-card class="px-4 py-2">
        <q-card-section>
          <div class="text-lg text-bold tracking-wide leading-relaxed py-2">
            Your keys <q-icon name="vpn_key" />
          </div>
          <p v-if="$store.state.keys.priv">
            Make sure you back up your private key!
          </p>
          <p v-else>Your private key is not here!</p>
          <div class="mt-1 text-xs">
            Posts are published using your private key. Others can see your
            posts or follow you using only your public key.
          </div>
        </q-card-section>

        <q-card-section>
          <p>Private Key:</p>
          <q-input
            v-model="$store.state.keys.priv"
            class="mb-2"
            readonly
            filled
          />
          <p>Public Key:</p>
          <q-input v-model="$store.state.keys.pub" readonly filled />
        </q-card-section>

        <q-card-actions align="right" class="text-primary">
          <q-btn v-close-popup flat label="Close" />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script>
import {LocalStorage} from 'quasar'
import {nextTick} from 'vue'

import helpersMixin from '../utils/mixin'
import {eraseDatabase} from '../db'

export default {
  name: 'Settings',
  mixins: [helpersMixin],

  data() {
    const {name, picture, about} =
      this.$store.state.profilesCache[this.$store.state.keys.pub] || {}

    return {
      keysDialog: false,
      addingRelay: '',
      metadata: {
        name,
        picture,
        about
      },
      unsubscribe: null
    }
  },

  mounted() {
    if (this.$route.params.showKeys) this.keysDialog = true

    this.unsubscribe = this.$store.subscribe((mutation, state) => {
      switch (mutation.type) {
        case 'addProfileToCache': {
          const {name, picture, about} =
            state.profilesCache[state.keys.pub] || {}

          nextTick(() => {
            setTimeout(() => {
              if (!this.metadata.name && name) this.metadata.name = name
              if (!this.metadata.picture && picture)
                this.metadata.picture = picture
              if (!this.metadata.about && about) this.metadata.about = about
            }, 1)
          })

          break
        }
        case 'setKeys': {
          nextTick(() => {
            setTimeout(() => {
              this.keysDialog = true
            }, 1)
          })
          break
        }
      }
    })
  },

  beforeUnmount() {
    if (this.unsubscribe) this.unsubscribe()
  },

  methods: {
    setMetadata() {
      this.$store.dispatch('setMetadata', this.metadata)
    },
    addRelay() {
      this.$store.commit('addRelay', this.addingRelay)
      this.addingRelay = ''
    },
    removeRelay(url) {
      this.$q
        .dialog({
          title: 'Are you sure?',
          message: `Do you really want to remove ${url} from the list of relays?`,
          cancel: true
        })
        .onOk(() => {
          this.$store.commit('removeRelay', url)
        })
    },
    setRelayOpt(url, opt, value) {
      this.$store.commit('setRelayOpt', {url, opt, value})
    },
    async hardReset() {
      this.$q
        .dialog({
          title: 'Are you sure?',
          message: 'Do you really want to delete all data from this device?',
          cancel: true
        })
        .onOk(async () => {
          LocalStorage.clear()
          await eraseDatabase()
          window.location.reload()
        })
    }
  }
}
</script>
