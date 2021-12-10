<template>
  <q-card class="q-pa-md q-pt-lg q-mt-md">
    <q-stepper v-model="step" vertical color="primary" animated>
      <q-step
        :name="1"
        title="Generate/Restore"
        icon="settings"
        :done="step > 1"
      >
        Nostr.org uses a word list of 12 words is used to create your keys, to
        restore either enter a word list or a Nostr private key.
        <q-input
          v-model="recover"
          :loading="loading"
          autogrow
          type="textarea"
          label="Word List/Private Key"
        ></q-input
        ><br />

        <q-btn
          color="primary"
          label="Generate"
          class="q-mr-md"
          @click="createKeys"
        />
        <q-btn
          color="primary"
          label="Restore"
          class="q-mr-md"
          @click="createKeys"
        />

        <q-btn
          v-if="privatekey"
          color="primary"
          label="Continue"
          @click="step = 2"
        />
      </q-step>

      <q-step :name="2" title="Your keys" icon="vpn_key" :done="step > 2">
        In this client you can restore from a word list but for other clients
        you will need to use your keys as well.<br /><br />
        Your private key is used to sign/publish posts.
        <br />
        <q-input
          v-model="privatekey"
          filled
          :type="isPwd ? 'password' : 'text'"
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
              :name="isPwd ? 'visibility_off' : 'visibility'"
              class="cursor-pointer"
              @click="isPwd = !isPwd"
            ></q-icon>
          </template>
        </q-input>
        <br />
        Your public key allows other people to read your posts, follow you, and
        send you private messages.
        <br />
        <q-input v-model="publickey" filled type="text">
          <template #prepend>
            <q-icon
              name="content_copy"
              class="cursor-pointer"
              @click="copyToClip(publickey)"
            ></q-icon>
          </template>
        </q-input>

        <q-stepper-navigation>
          <q-btn color="primary" label="Continue" @click="step = 3" />
          <q-btn
            flat
            color="primary"
            label="Back"
            class="q-ml-sm"
            @click="step = 1"
          />
        </q-stepper-navigation>
      </q-step>

      <q-step :name="3" title="Key storage" icon="lock">
        To publish your posts this client needs to sign messages with your
        private key. Choose how this client will access your private key.
        <div class="q-pa-md q-gutter-sm">
          <div class="q-gutter-sm">
            <q-radio
              v-model="keystoreoption"
              dense
              val="local"
              label="Local Storage (Recommended)"
            /><br />
            <q-radio
              v-model="keystoreoption"
              dense
              disable
              val="url"
              label="URL (coming soon)"
            /><br />
            <q-radio
              v-model="keystoreoption"
              dense
              disable
              val="external"
              label="Hardware wallet (coming soon)"
            /><br />
          </div>
        </div>
        <q-stepper-navigation>
          <q-btn color="primary" label="Finish" @click="finalGenerate" />
          <q-btn
            flat
            color="primary"
            label="Back"
            class="q-ml-sm"
            @click="step = 2"
          />
        </q-stepper-navigation>
      </q-step>
    </q-stepper>
  </q-card>
</template>

<script>
import crypto from 'crypto'
import {getPublicKey} from 'nostr-tools'
import {copyToClipboard} from 'quasar'
import helpersMixin from '../utils/mixin'

const bip39 = require('bip39')
const bip32 = require('bip32')

export default {
  mixins: [helpersMixin],

  data() {
    return {
      step: 1,
      loading: false,
      recover: '',
      privatekey: null,
      publickey: null,
      keystoreoption: 'local',
      isPwd: true
    }
  },
  methods: {
    async createKeys() {
      this.loading = true
      this.recover = this.recover.trim()

      setTimeout(() => {
        if (this.recover.split(/ +/).length === 12) {
          // recover mnemonic
          let mnemonic = this.recover.split(/ +/).join(' ')
          let seed = bip39.mnemonicToSeedSync(mnemonic)
          let root = bip32.fromSeed(seed)
          this.privatekey = root.privateKey.toString('hex')

          this.recover = mnemonic
        } else if (/^[0-9a-f]{64}$/.exec(this.recover.toLowerCase())) {
          // recover private key
          this.privatekey = this.recover.toLowerCase()

          this.recover = this.privatekey
        } else {
          // generate a new seed
          let randomBytes = crypto.randomBytes(16)
          let mnemonic = bip39.entropyToMnemonic(randomBytes.toString('hex'))
          let seed = bip39.mnemonicToSeedSync(mnemonic)
          let root = bip32.fromSeed(seed)
          this.privatekey = root.privateKey.toString('hex')
          this.$q.notify({
            message: 'MAKE SURE YOU BACKUP YOUR WORD LIST'
          })

          this.recover = mnemonic
        }

        this.publickey = getPublicKey(this.privatekey)
        this.loading = false
      }, 1)
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

    finalGenerate() {
      this.$store.dispatch('finalGenerate', {
        privatekey: this.privatekey,
        publickey: this.publickey,
        keystoreoption: this.keystoreoption
      })

      if (this.keystoreoption === 'external') {
        this.$router.push('/?pub=' + this.publickey + '&prv=' + this.privatekey)
      } else {
        this.$router.push('/')
      }
    }
  }
}
</script>
