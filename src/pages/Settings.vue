<template>
  <q-page>
    <center>
      <strong class="text-h6 q-pa-lg">Settings</strong>
    </center>
    <q-btn
      v-go-back.single
      flat
      color="white"
      icon="arrow_back"
      label="back"
      class="small-screen-only fixed-top-left"
    />

    <br /><br />

    <div class="q-mx-auto q-px-md">
      <q-form class="q-gutter-md" @submit="setProfile">
        <p>
          If your desired handle is available our relay will use open-timestamps
          to secure it to your public key, and share the proof with other
          relays.
        </p>
        <q-input
          v-model="handle"
          filled
          disable
          type="text"
          hint="Desired handle (3-10 chars)"
          lazy-rules
          :rules="[
            val => (val !== null && val !== '') || 'Between 3 - 10 chars'
          ]"
        >
          <template #before>
            <q-icon name="alternate_email" />
          </template>
        </q-input>
        <q-input
          disable
          v-model="about"
          filled
          type="text"
          hint="About (in 150 chars)"
          maxlength="150"
        />
        <q-input
          disable
          v-model="picture"
          filled
          type="text"
          hint="Picture URL"
          maxlength="150"
        />
        <q-btn
          disable
          class="float-right"
          unelevated
          label="Submit"
          type="submit"
          color="primary"
        />
        <br />
        <q-tooltip> Coming soon </q-tooltip>
      </q-form>
      <br /><br />
      <q-separator />
      <br />
      <q-form class="q-gutter-md" @submit="relayAdd">
        <div class="row">
          <div class="col-9">
            <q-input
              v-model="addingRelay"
              filled
              type="textarea"
              autogrow
              hint="Add a relay"
            />
          </div>
          <div class="col-3">
            <q-btn
              unelevated
              label="Add"
              type="submit"
              color="primary"
              class="q-ml-md q-pa-sm"
            />
          </div>
        </div>
      </q-form>
      <br /><br />
      <q-form class="q-gutter-md" @submit="relayRem">
        <div class="row">
          <div class="col-9">
            <q-select
              v-model="removingRelay"
              filled
              :options="$store.state.myProfile.relays"
              hint="Remove a relay"
            />
          </div>
          <div class="col-3">
            <q-btn
              class="q-ml-md q-pa-sm"
              unelevated
              label="Remove"
              type="submit"
              color="primary"
            />
          </div>
        </div>
      </q-form>
      <br /><br />
      <q-separator />

      <br /><br />
      <q-btn
        unelevated
        label="Delete Local Storage"
        color="negative"
        @click="deleteAccDialog = true"
      />
      <q-btn
        unelevated
        class="q-ml-md"
        label="View your keys"
        color="negative"
        @click="privateKey"
      />
    </div>

    <q-dialog v-model="privateKeyDialog">
      <q-card style="min-width: 350px">
        <q-card-section>
          <div class="text-h6">Your keys <q-icon name="vpn_key" /></div>
          <p>
            Make sure you back up your private key! <br />
            <small
              >*Posts are published using your private key. Others can see your
              posts/follow you using your public key.</small
            >
          </p>
        </q-card-section>

        <q-card-section class="q-pt-none">
          <p>Private key:</p>
          <q-input
            v-model="privatekey"
            filled
            :type="isPrivPwd ? 'password' : 'text'"
          >
            <template #prepend>
              <q-icon
                name="content_copy"
                class="cursor-pointer"
                @click="copyToClip(privatekey)"
              ></q-icon>
            </template>
            <template #append>
              <q-icon
                :name="isPrivPwd ? 'visibility_off' : 'visibility'"
                class="cursor-pointer"
                @click="isPrivPwd = !isPrivPwd"
              ></q-icon>
            </template>
          </q-input>
          <br />
          <p>Public key:</p>
          <q-input v-model="publickey" filled>
            <template #prepend>
              <q-icon
                name="content_copy"
                class="cursor-pointer"
                @click="copyToClip(publickey)"
              ></q-icon>
            </template>
          </q-input>
        </q-card-section>

        <q-card-actions align="right" class="text-primary">
          <q-btn flat label="Close" v-close-popup />
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
          <q-btn flat label="Cancel" v-close-popup />
          <q-btn flat label="Yes, delete storage" @click="hardReset" />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script>
import helpersMixin from '../utils/mixin'
import {copyToClipboard} from 'quasar'

export default {
  name: 'Settings',
  mixins: [helpersMixin],
  data() {
    const {name, picture, about} = this.$store.state.me

    return {
      privatekey: null,
      publickey: null,
      deleteAccDialog: false,
      privateKeyDialog: false,
      removingRelay: '',
      addingRelay: '',
      isPrivPwd: true,
      isPwd: true,
      addPubKey: ''
    }
  },
  methods: {
    setProfile() {
      this.$store.dispatch('setMetadata', {
        name: this.handle,
        about: this.about,
        picture: this.picture
      })
    },
    privateKey() {
      this.privateKeyDialog = true
      this.privatekey = this.$store.state.myProfile.privkey
      this.publickey = this.$store.state.myProfile.pubkey
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
      this.$store.commit('removeRelat', this.removingRelay)
      this.removingRelay = ''
    },
    hardReset() {
      this.$q.localStorage.clear()
      window.location.reload()
    }
  }
}
</script>
