<template>
  <q-page class="px-4 py-6">
    <div class="text-xl">Settings</div>

    <q-separator />
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
        v-model.trim="metadata.picture"
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
      <q-input
        v-model.trim="metadata.nip05"
        filled
        type="text"
        label="NIP-05 Identifier"
        maxlength="50"
      />
      <q-btn label="Save" type="submit" color="primary" />
    </q-form>
    <q-separator />
    <div class="my-8">
      <div class="text-lg p-4">Relays</div>
      <q-list class="mb-3">
        <q-item
          v-for="([url, r, w], idx) in changedRelays || $store.state.relays"
          :key="url"
        >
          <q-item-section class="opacity-75">
            <div class="flex-inline">
              <q-btn
                round
                flat
                color="negative"
                icon="cancel"
                size="xs"
                :disable="!$store.getters.canSignEventsAutomatically"
                @click="removeRelay(url, idx)"
              />
              {{ url }}
              <q-btn
                color="primary"
                size="sm"
                label="Share"
                :disable="
                  hasJustSharedRelay ||
                  !$store.getters.canSignEventsAutomatically
                "
                @click="shareRelay(url)"
              />
            </div>
          </q-item-section>
          <q-item-section side>
            <div class="flex-inline">
              <span
                class="cursor-pointer tracking-wide"
                :class="{'font-bold': r == '', 'text-secondary': r == ''}"
                @click="
                  $store.getters.canSignEventsAutomatically
                    ? setRelay(idx, 1 /* read is idx 1 */, r == '' ? '!' : '')
                    : null
                "
              >
                read
              </span>
              <span
                class="cursor-pointer tracking-wide"
                :class="{'font-bold': w == '', 'text-secondary': w == ''}"
                @click="
                  $store.getters.canSignEventsAutomatically
                    ? setRelay(idx, 2 /* write is idx 2 */, w == '' ? '!' : '')
                    : null
                "
              >
                write
              </span>
            </div>
          </q-item-section>
        </q-item>
      </q-list>
      <q-form @submit="addRelay">
        <q-input
          v-model="addingRelay"
          class="mx-3"
          filled
          label="Add a relay"
          :disable="!$store.getters.canSignEventsAutomatically"
        >
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
      <q-form class="mx-3 my-3">
        <q-btn
          label="Save"
          color="primary"
          :disable="changedRelays === null"
          @click="saveRelays"
        />
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
import {queryName} from 'nostr-tools/nip05'
import {normalizeRelayURL} from 'nostr-tools/relay'

import helpersMixin from '../utils/mixin'

export default {
  name: 'Settings',
  mixins: [helpersMixin],

  data() {
    const {name, picture, about, nip05} =
      this.$store.state.profilesCache[this.$store.state.keys.pub] || {}

    return {
      keysDialog: false,
      addingRelay: '',
      changedRelays: null,
      metadata: {
        name,
        picture,
        about,
        nip05
      },
      unsubscribe: null,
      hasJustSharedRelay: false
    }
  },

  mounted() {
    if (this.$route.params.showKeys) this.keysDialog = true

    this.unsubscribe = this.$store.subscribe((mutation, state) => {
      switch (mutation.type) {
        case 'addProfileToCache': {
          const {name, picture, about, nip05} =
            state.profilesCache[state.keys.pub] || {}

          nextTick(() => {
            setTimeout(() => {
              if (!this.metadata.name && name) this.metadata.name = name
              if (!this.metadata.picture && picture)
                this.metadata.picture = picture
              if (!this.metadata.about && about) this.metadata.about = about
              if (!this.metadata.nip05 && nip05) this.metadata.nip05 = nip05
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
    async setMetadata() {
      if (this.metadata.nip05 === '') this.metadata.nip05 = undefined
      if (this.metadata.nip05) {
        if (
          (await queryName(this.metadata.nip05)) !== this.$store.state.keys.pub
        ) {
          this.$q.notify({
            message: 'Failed to verify NIP05 identifier on server.',
            color: 'warning'
          })

          return
        }
      }

      this.$store.dispatch('setMetadata', this.metadata)
    },
    addRelay() {
      this.changedRelays =
        this.changedRelays || this.$store.state.relays.concat([])
      this.changedRelays.push([normalizeRelayURL(this.addingRelay), '', ''])
      this.addingRelay = ''
    },
    removeRelay(url, idx) {
      this.$q
        .dialog({
          title: 'Are you sure?',
          message: `Do you really want to remove ${url} from the list of relays?`,
          cancel: true
        })
        .onOk(() => {
          this.changedRelays =
            this.changedRelays || this.$store.state.relays.concat([])
          this.changedRelays.splice(idx, 1)
        })
    },
    setRelay(idx, opt, value) {
      this.changedRelays =
        this.changedRelays || this.$store.state.relays.concat([])
      this.changedRelays[idx][opt] = value
    },
    saveRelays() {
      this.$store.commit('setRelays', this.changedRelays)
      this.changedRelays = null
      this.$store.dispatch('publishRelaysList')
    },
    shareRelay(url) {
      this.hasJustSharedRelay = true
      this.$store.dispatch('recommendServer', url)
      setTimeout(() => {
        this.hasJustSharedRelay = false
      }, 5000)
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

          await indexedDB.databases().then(dbs => {
            let promises = dbs.map(
              db =>
                new Promise((resolve, reject) => {
                  var req = indexedDB.deleteDatabase(db.Name)
                  req.onsuccess = resolve
                  req.onerror = reject
                  req.onblocked = reject
                })
            )
            Promise.all(promises).then(console.log).catch(console.error)
          })

          window.location.reload()
        })
    }
  }
}
</script>
