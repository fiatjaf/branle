<template>
  <q-dialog v-model="initializeKeys" persistent>
    <q-card class="q-pb-xl q-pt-md q-pl-sm q-pr-sm">
      <q-card-section class="intro">
        <h1 class="text-h6">welcome to astral</h1>
        <p>
          astral is a decentralized, censorship resistant social platform
          powered by the Nostr protocol. in order to participate in the Nostr
          network you will need to a public key and private key pair:
        </p>

        <q-list bordered padding class="q-mt-sm q-mb-sm">
          <q-item>
            <q-item-section>
              <q-item-label>public key</q-item-label>
              <q-item-label caption>
                publicly known unique ID associated with your user on the Nostr
                network. can be shared freely. others can see your posts or
                follow you using only your public key.
              </q-item-label>
            </q-item-section>
          </q-item>

          <q-item>
            <q-item-section>
              <q-item-label>private key</q-item-label>
              <q-item-label caption>
                <strong>KEEP THIS SECRET!</strong> secret key used to sign for
                (or unlock) your public key. all content from your user public
                key will need a signature derived from your private key before
                being relayed. if a bad actor discovers your private key they
                can impersonate you on Nostr network.
              </q-item-label>
            </q-item-section>
          </q-item>
        </q-list>
      </q-card-section>
      <q-card-section class="onboard">
        <p>
          if you don't have a Nostr key pair you can either
          <strong>generate</strong> a new key pair or just take a
          <strong>look around</strong> using astral's public key.
        </p>
        <q-btn-group spread unelevated class='q-gutter-xl'>
          <q-btn size="sm" outline @click="generate" color="primary"
            >generate</q-btn
          >
          <q-btn size="sm" outline color="primary" @click="getAstralPublicKey"
            >look around</q-btn
          >
        </q-btn-group>
      </q-card-section>
      <q-form @submit="proceed">
        <q-card-section class="key-entry">
          <h2 class="text-subtitle2">enter your key</h2>
          <q-btn-group spread unelevated>
            <q-btn
              size="sm"
              color="primary"
              label="public key"
              :outline="!watchOnly"
              value="true"
              @click="watchOnly = true"
            />
            <q-btn
              size="sm"
              color="primary"
              label="private key"
              :outline="watchOnly"
              value="false"
              @click="watchOnly = false"
            />
          </q-btn-group>
          <q-input
            v-model="key"
            ref="keyInput"
            bottom-slots
            outlined
            :label="watchOnly ? 'enter public key' : 'enter private key'"
            dense
          >
            <template #hint>
              <p v-if="!key && watchOnly">
                entering public key means you will need to enter private key
                each time you post content (either manually or by Nostr browser
                extension)
              </p>
              <p v-if="!key && !watchOnly">
                entering private key means astral will automatically sign with
                your private key each time you post content
              </p>
              <p v-if="key && !isKeyValid">not a valid key</p>
              <p v-if="isKeyValid">key is valid</p>
            </template>
            <template #append>
              <q-btn
                v-if="hasExtension && !isKeyValid"
                size="sm"
                color="primary"
                outline
                @click="getFromExtension"
              >
                Use Public Key from Extension
              </q-btn>
              <q-btn
                type="submit"
                unelevated
                size="sm"
                color="positive"
                :label="isKeyValid ? 'proceed' : ''"
                icon-right="login"
                @click="proceed"
                :disabled="!isKeyValid"
              ></q-btn>
            </template>
          </q-input>
        </q-card-section>
      </q-form>
    </q-card>
  </q-dialog>
</template>

<script>
import { defineComponent } from 'vue'
import helpersMixin from '../utils/mixin'
import { validateWords } from 'nostr-tools/nip06'
import { generatePrivateKey } from 'nostr-tools'

export default defineComponent({
  name: 'TheKeyInitializationDialog',
  mixins: [helpersMixin],

  setup() {
    return {
      focusKeyInput() {
        this.$refs.keyInput.focus()
      },
    }
  },

  data() {
    return {
      initializeKeys: true,
      watchOnly: false,
      key: null,
      hasExtension: false,
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
    },
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
        this.focusKeyInput()
      } catch (err) {
        this.$q.notify({
          message: `Failed to get a public key from a Nostr extension: ${err}`,
          color: 'warning',
        })
      }
    },

    getAstralPublicKey() {
      this.key =
        '2df69cd0c6ab95e08f466abe7b39bb64e744ee31ffc3041f270bdfec2a37ec06'
      this.watchOnly = true
      this.focusKeyInput()
    },

    generate() {
      this.key = generatePrivateKey()
      this.watchOnly = false
      this.focusKeyInput()
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
        params: { showKeys: true },
      })
    },

    isKey(key) {
      return key?.toLowerCase()?.match(/^[0-9a-f]{64}$/)
    },
  },
})
</script>

<style>
</style>
