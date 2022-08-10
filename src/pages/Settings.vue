<template>
  <q-page>
    <div class="text-h5 text-bold q-py-md">{{ $t('settings') }}</div>
    <q-separator color='accent' size='2px'/>
    <q-form class="q-gutter-md" @submit="setMetadata">
      <!-- <div class="text-lg p-4">Profile</div> -->
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
          <BaseUserAvatar v-if="metadata.picture" :pubkey='$store.state.keys.pub' rounded/>
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
    <q-separator color='accent' spaced/>
    <div class="my-8">
      <div class="text-bold flex justify-between no-wrap" style='font-size: 1.1rem;'>
        {{ $t('relays') }}
        <div class="text-normal flex row no-wrap" style='font-size: .9rem;'>
          <div style='width: 3.4em; text-align: center;'>read</div>
          <div style='width: 3.4em; text-align: center;'>write</div>
        </div>
      </div>
      <q-list class="mb-3">
        <q-item v-for="([url]) in activeRelays" :key="url" class='flex justify-between items-center no-wrap no-padding'>
          <div>
              {{ url }}
          </div>
          <div class="flex no-wrap items-center">
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
              <q-toggle
                v-model='editedRelays[url].read'
                color='secondary'
                size='sm'
                class='no-padding'
                @click='toggleEditingRelays'
              />
              <q-toggle
                v-model='editedRelays[url].write'
                color='secondary'
                size='sm'
                class='no-padding'
                @click='toggleEditingRelays'
              />
              <!-- <span
                class="cursor-pointer tracking-wide"
                :class="{'font-bold': opts.read, 'text-secondary': opts.read}"
                @click="
                  $store.getters.canSignEventsAutomatically
                    ? setRelayOpt(url, 'read', !opts.read)
                    : null
                "
              >
                {{ $t('read') }}
              </span>
              <span
                class="cursor-pointer tracking-wide"
                :class="{'font-bold': opts.write, 'text-secondary': opts.write}"
                @click="
                  $store.getters.canSignEventsAutomatically
                    ? setRelayOpt(url, 'write', !opts.write)
                    : null
                "
              >
                {{ $t('write') }}
              </span> -->
          </div>
        </q-item>
        <q-item v-for="([url]) in inactiveRelays" :key="url" class='flex justify-between items-center no-wrap no-padding'>
          <div>
              {{ url }}
          </div>
          <div class="flex no-wrap items-center">
              <!-- <q-btn
                color="primary"
                size="sm"
                label="Share"
                :disable="
                  hasJustSharedRelay ||
                  !$store.getters.canSignEventsAutomatically
                "
                @click="shareRelay(url)"
              /> -->
              <q-btn
                color="negative"
                label='remove'
                size="sm"
                :disable="!$store.getters.canSignEventsAutomatically"
                @click="removeRelay(url)"
              />
              <q-toggle
                v-model='editedRelays[url].read'
                color='secondary'
                size='sm'
                class='no-padding'
                @click='toggleEditingRelays'
              />
              <q-toggle
                v-model='editedRelays[url].write'
                color='secondary'
                size='sm'
                class='no-padding'
                @click='toggleEditingRelays'
              />
              </div>
        </q-item>
      </q-list>
      <div>
        <q-btn label="save" color="primary" :disable='!editingRelays' @click='setRelayOpt'/>
        <q-btn label="reset" color="secondary" :disable='!editingRelays' @click='cloneRelays'/>
      </div>
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
      <!-- <div class="text-bold" style='font-size: 1.1rem;'>{{ $t('inactiveRelays') }}</div>
      <q-list class="mb-3">
        <q-item v-for="([url]) in inactiveRelays" :key="url">
          <q-item-section>
            <div class="flex justify-between">
              {{ url }}
              <q-btn
                color="negative"
                label='remove'
                size="sm"
                :disable="!$store.getters.canSignEventsAutomatically"
                @click="removeRelay(url)"
              />
            </div>
          </q-item-section>
        </q-item>
      </q-list> -->
    </div>

    <q-separator color='accent' spaced/>

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

import helpersMixin from '../utils/mixin'
import {eraseDatabase} from '../db'

export default {
  name: 'Settings',
  mixins: [helpersMixin],

  data() {
    const {name, picture, about, nip05} =
      this.$store.state.profilesCache[this.$store.state.keys.pub] || {}

    return {
      keysDialog: false,
      relays: {},
      editedRelays: {},
      editingRelays: false,
      addingRelay: '',
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

  watch: {
    '$store.state.relays'(curr, prev) {
      if (curr !== prev) this.cloneRelays()
    }
  },

  computed: {
    storeRelays() {
      // if (Object.keys(this.$store.state.relays).length) return this.$store.state.relays
      // return {}
      return this.$store.state.relays || {}
    },
    activeRelays() {
      return Object.entries(this.relays).filter(([url, opts]) => opts.read === true || opts.write === true)
      // return Object.entries(this.relays).filter(([url, opts]) => opts.read === true || opts.write === true)
    },
    inactiveRelays() {
      return Object.entries(this.relays).filter(([url, opts]) => opts.read === false && opts.write === false)
      // return Object.entries(this.relays).filter(([url, opts]) => opts.read === false && opts.write === false)
    },
    activeRelaysCopy() {
      return Object.entries(this.storeRelays).filter(([url, opts]) => opts.read === true || opts.write === true)
    },
    inactiveRelaysCopy() {
      return Object.entries(this.storeRelays).filter(([url, opts]) => opts.read === false && opts.write === false)
    },
    // editingRelays() {
    //   if (this.activeRelays.filter(([url, opts]) =>
    //     this.editedRelays[url].read !== opts.read ||
    //     this.editedRelays[url].write !== opts.write).length) return true
    //   return false
    // }
  },

  mounted() {
    if (this.$route.params.showKeys) {
      this.keysDialog = true
    }

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
    this.cloneRelays()
    console.log(this.relays)
  },

  beforeUnmount() {
    if (this.unsubscribe) this.unsubscribe()
  },

  methods: {
    cloneRelays() {
      this.relays = JSON.parse(JSON.stringify(this.$store.state.relays))
      this.editedRelays = JSON.parse(JSON.stringify(this.$store.state.relays))
    },
    toggleEditingRelays(value, evt) {
      if (Object.entries(this.editedRelays).filter(([url, opts]) =>
        this.relays[url].read !== opts.read ||
        this.relays[url].write !== opts.write).length) this.editingRelays = true
      else this.editingRelays = false
    },
    async setMetadata() {
      if (this.metadata.nip05 === '') this.metadata.nip05 = undefined
      if (this.metadata.nip05) {
        if (
          (await queryName(this.metadata.nip05)) !== this.$store.state.keys.pub
        ) {
          console.log(this.metadata)
          console.log(await queryName(this.metadata.nip05))
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
    setRelayOpt() {
      console.log('setRelayOpt')
      if (this.$store.getters.canSignEventsAutomatically) Object.entries(this.editedRelays)
        .forEach(([url, opts]) => {
          if (this.relays[url].read !== opts.read) this.$store.commit('setRelayOpt', {url, opt: 'read', value: opts.read})
          if (this.relays[url].write !== opts.write) this.$store.commit('setRelayOpt', {url, opt: 'write', value: opts.write})
        })
    },
    // setRelayOpt(url, opt, value) {
    //   this.$store.commit('setRelayOpt', {url, opt, value})
    // },
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
          await eraseDatabase()
          window.location.reload()
        })
    },
  }
}
</script>
