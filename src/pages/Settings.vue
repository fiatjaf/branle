<template>
  <q-page>
    <div class="text-h5 text-bold q-py-md">{{ $t('settings') }}</div>
    <q-separator color='accent' size='2px'/>
    <q-form class="q-gutter-md q-pt-sm" @submit="setMetadata">
      <div v-if='editingMetadata' class='flex justify-between' style='display: flex; gap: .2rem;'>
        <q-btn label="save" color="primary" size="sm" type="submit"/>
        <q-btn label="cancel" color="negative" size="sm" @click='cancel("metadata")'/>
      </div>
      <div class="text-bold flex justify-between no-wrap" style='font-size: 1.1rem;'>
          {{ $t('profile') }}
          <q-btn v-if='!editingMetadata' label="edit" color="primary" size="sm" @click='editingMetadata = true'/>
      </div>
      <q-input v-model="metadata.name" filled type="text" label="Name" :disable='!editingMetadata'>
        <template #before>
          <q-icon name="alternate_email" />
        </template>
      </q-input>
      <q-input
        v-model="metadata.about"
        :disable='!editingMetadata'
        filled
        autogrow
        type="text"
        label="About (in 150 chars)"
        maxlength="150"
      />
      <q-input
        v-model.trim="metadata.picture"
        :disable='!editingMetadata'
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
        :disable='!editingMetadata'
        filled
        type="text"
        label="NIP-05 Identifier"
        maxlength="50"
      />
    </q-form>
    <q-separator color='accent' spaced/>
    <div>
      <div v-if='editingRelays' class='flex justify-between' style='display: flex; gap: .2rem;'>
        <q-btn label="save" color="primary" size="sm" @click='saveRelays'/>
        <q-btn label="cancel" color="negative" size="sm" @click='cancel("relays")'/>
      </div>
      <div class="text-bold flex justify-between no-wrap" style='font-size: 1.1rem;'>
        {{ $t('relays') }}
        <div class="text-normal flex row no-wrap" style='font-size: .9rem; gap: .4rem;'>
          <q-btn v-if='!editingRelays' label="edit" color="primary" size="sm" @click='editingRelays = true'/>
          <div v-if='editingRelays'>read</div>
          <div v-if='editingRelays'>write</div>
        </div>
      </div>
      <q-list class='flex column q-pt-xs' style='gap: .2rem;'>
        <q-item
          v-for="(url) in Object.keys(relays)"
          :key="url"
          class='flex justify-between items-center no-wrap no-padding'
          style='min-height: 1.2rem'
        >
          <div>
              <q-btn
                v-if='relays[url].read || relays[url].write'
                color="secondary"
                size="sm"
                label="Share"
                :disable="
                  hasJustSharedRelay ||
                  !$store.getters.canSignEventsAutomatically
                "
                @click="shareRelay(url)"
              />
              <q-btn
                v-if='editingRelays && !relays[url].read && !relays[url].write'
                color="negative"
                label='remove'
                size="sm"
                :disable="!$store.getters.canSignEventsAutomatically"
                @click="removeRelay(url)"
              />
              {{ url }}
          </div>
          <div class="flex no-wrap items-center" style='gap: .6rem;'>
              <q-toggle
                v-if='editingRelays'
                v-model='relays[url].read'
                color='primary'
                size='sm'
                dense
                class='no-padding'
              />
              <q-toggle
                v-if='editingRelays'
                v-model='relays[url].write'
                color='primary'
                size='sm'
                dense
                class='no-padding'
              />
          </div>
        </q-item>
      </q-list>
      <q-form v-if='editingRelays' class='q-py-xs' @submit="addRelay">
        <q-input
          v-model="addingRelay"
          filled
          dense
          autofocus
          label="Add a relay"
          :disable="!$store.getters.canSignEventsAutomatically"
        >
          <template #append>
            <q-btn
              label="Add"
              type="submit"
              color="primary"
              size="sm"
              @click="addRelay"
            />
          </template>
        </q-input>
      </q-form>
    </div>

    <q-separator color='accent' spaced/>

    <div class="flex no-wrap" style='gap: .2rem;'>
      <q-btn label="Delete Local Data" color="negative" @click="hardReset" />
      <q-btn label="View your keys" color="primary" @click="keysDialog = true" />
      <q-btn label="dev tools" color='secondary' :to='{ name: "devTools"}' />
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
import {dbErase} from '../query'

export default {
  name: 'Settings',
  mixins: [helpersMixin],

  data() {
    const {name, picture, about, nip05} =
      this.$store.state.profilesCache[this.$store.state.keys.pub] || {}

    return {
      keysDialog: false,
      editingMetadata: false,
      metadata: {
        name,
        picture,
        about,
        nip05
      },
      relays: {},
      editingRelays: false,
      addingRelay: '',
      unsubscribe: null,
      hasJustSharedRelay: false
    }
  },

  watch: {
    '$store.state.relays'(curr, prev) {
      if (curr !== prev) this.cloneRelays()
    },
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
  },

  beforeUnmount() {
    if (this.unsubscribe) this.unsubscribe()
  },

  methods: {
    cloneMetadata() {
      let {name, picture, about, nip05} = this.$store.state.profilesCache[this.$store.state.keys.pub]
      this.metadata = {name, picture, about, nip05}
      console.log('cloneMeta', this.metadata)
    },
    cloneRelays() {
      this.relays = JSON.parse(JSON.stringify(this.$store.state.relays))
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
      this.relays[this.addingRelay] = { read: true, write: true }
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
          delete this.relays[url]
        })
    },
    saveRelays() {
      if (this.$store.getters.canSignEventsAutomatically) this.$store.commit('saveRelays', this.relays)
    },
    cancel(section) {
      if (section === 'metadata') {
        this.editingMetadata = false
        this.cloneMetadata()
        return
      }
      if (section === 'relays') {
        this.editingRelays = false
        this.cloneRelays()
        return
      }
    },
    shareRelay(url) {
      this.hasJustSharedRelay = true
      this.$store.dispatch('recommendRelay', url)
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
          // await eraseDatabase()
          await dbErase()
          window.location.reload()
        })
    },
  }
}
</script>
