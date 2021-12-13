<template>
  <q-page>
    <div class="text-lg">Settings</div>

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
      />
      <q-btn label="Save" type="submit" color="primary" />
    </q-form>
    <q-separator />
    <div class="my-8">
      <div class="text-lg p-4">Relays</div>
      <q-form @submit="addRelay">
        <div>
          <q-input
            v-model="addingRelay"
            filled
            type="textarea"
            autogrow
            label="Add a relay"
          >
            <template #append>
              <q-btn label="Add" type="submit" color="primary" class="ml-3" />
            </template>
          </q-input>
        </div>
      </q-form>

      <q-form class="mt-3" @submit="removeRelay">
        <q-select
          v-model="removingRelay"
          filled
          :options="Object.keys($store.state.relays)"
          label="Remove a relay"
        >
          <template #append>
            <q-btn label="Remove" type="submit" color="primary" />
          </template>
        </q-select>
      </q-form>
    </div>

    <q-separator />

    <div class="my-8">
      <div class="text-lg p-4">Other</div>
      <q-btn
        label="Delete Local Storage"
        color="primary"
        @click="deleteAccDialog = true"
      />
      <q-btn
        class="q-ml-md"
        label="View your keys"
        color="primary"
        @click="keysDialog = true"
      />
    </div>

    <q-dialog v-model="keysDialog">
      <q-card style="min-width: 350px">
        <q-card-section>
          <div class="text-h6">Your keys <q-icon name="vpn_key" /></div>
          <p>
            Make sure you back up your private key! <br />
            <small
              >Posts are published using your private key. Others can see your
              posts or follow you using only your public key.</small
            >
          </p>
        </q-card-section>

        <q-card-section>
          <p>Seed Words:</p>
          <q-input
            v-model="$store.state.keys.mnemonic"
            class="mb-2"
            readonly
            filled
          />
          <p>Private Key:</p>
          <q-input
            v-model="$store.state.keys.priv"
            class="mb-2"
            readonly
            filled
          />
          <p>Public Key:</p>
          <q-input v-model="$store.state.keys.pub" readonly filled> </q-input>
        </q-card-section>

        <q-card-actions align="right" class="text-primary">
          <q-btn v-close-popup flat label="Close" />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <q-dialog v-model="deleteAccDialog">
      <q-card style="min-width: 350px">
        <q-card-section>
          <div class="text-h6">Are you sure?</div>
          <p>Deleting storage will remove all traces of this account!</p>
        </q-card-section>

        <q-card-actions align="right" class="text-primary">
          <q-btn v-close-popup flat label="Cancel" />
          <q-btn flat label="Yes, delete storage" @click="hardReset" />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script>
import {copyToClipboard} from 'quasar'

import helpersMixin from '../utils/mixin'
import {db} from '../db'

export default {
  name: 'Settings',
  mixins: [helpersMixin],
  data() {
    const {name, picture, about} = this.$store.state.me

    return {
      deleteAccDialog: false,
      keysDialog: false,
      removingRelay: '',
      addingRelay: '',
      metadata: {
        name,
        picture,
        about
      }
    }
  },
  methods: {
    setMetadata() {
      this.$store.dispatch('setMetadata', this.metadata)
    },
    copyToClip(text) {
      copyToClipboard(text)
        .then(() => {
          this.$q.notify({
            message: 'COPIED'
          })
        })
        .catch(() => {
          this.$q.notify({type: 'negative', message: 'FAILED'})
        })
    },
    addRelay() {
      this.$store.commit('addRelay', this.addingRelay)
      this.addingRelay = ''
    },
    removeRelay() {
      this.$store.commit('removeRelay', this.removingRelay)
      this.removingRelay = ''
    },
    async hardReset() {
      this.$q.localStorage.clear()
      await db.destroy()
      window.location.reload()
    }
  }
}
</script>
