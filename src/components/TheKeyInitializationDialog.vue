<template>
  <!-- <q-dialog v-model="showKeyInitialization" persistent> -->
  <div v-if="showKeyInitialization">
    <q-card style='background: unset'>
      <q-card-section class="intro">
        <h1 class="text-h6">welcome to astral</h1>
        <BaseMarkdown>
          astral is a decentralized, censorship resistant social platform
          powered by the [Nostr](https://github.com/fiatjaf/nostr) protocol. in order to participate in the Nostr
          network you will need to a public key and private key pair:
        </BaseMarkdown>

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
          <strong>look around</strong>.
        </p>
        <q-btn-group spread unelevated class='q-gutter-xl'>
          <q-btn size="sm" outline @click="generate" color="primary">
            generate
          </q-btn>
          <q-btn size="sm" outline color="primary" :to='{ name: "feed" }'>
            look around
          </q-btn>
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
              :text-color="!watchOnly ? '' : 'dark'"
              value="true"
              @click="watchOnly = true"
              :disable='isBech32Sec'
            />
            <q-btn
              size="sm"
              color="primary"
              label="private key"
              :outline="watchOnly"
              :text-color="watchOnly ? '' : 'dark'"
              value="false"
              @click="watchOnly = false"
              :disable='isBech32Pub'
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
      <div v-if='isBeck32Key(key)'>
      {{ hexKey }}
      </div>
    </q-card>
  </div>
  <!-- </q-dialog> -->
</template>

<script>
import { defineComponent } from 'vue'
import helpersMixin from '../utils/mixin'
import { validateWords } from 'nostr-tools/nip06'
import { generatePrivateKey } from 'nostr-tools'
import { decode } from 'bech32-buffer'
import BaseMarkdown from 'components/BaseMarkdown.vue'

export default defineComponent({
  name: 'TheKeyInitializationDialog',
  mixins: [helpersMixin],

  components: {
    BaseMarkdown,
  },

  setup() {
    return {
      focusKeyInput() {
        this.$refs.keyInput.focus()
      },
    }
  },

  data() {
    return {
      watchOnly: false,
      key: null,
      hasExtension: false,
    }
  },

  computed: {
    icon() {
      return document.getElementById('icon').href
    },

    showKeyInitialization() {
      if (['profile', 'event', 'hashtag', 'feed'].includes(this.$route.name)) return false
      return true
    },

    isKeyKey() {
      if (this.isKey(this.hexKey)) return true
      return false
    },

    isKeyValid() {
      if (this.isKeyKey) return true
      if (validateWords(this.key?.toLowerCase())) return true
      return false
    },

    hexKey() {
      // npub1xtscya34g58tk0z605fvr788k263gsu6cy9x0mhnm87echrgufzsevkk5s
      // nsec1xtscya34g58tk0z605fvr788k263gsu6cy9x0mhnm87echrgufzs46ahj9
      // 32e1827635450ebb3c5a7d12c1f8e7b2b514439ac10a67eef3d9fd9c5c68e245
      if (this.isBeck32Key(this.key)) {
        let { data } = decode(this.key.toLowerCase())
        return this.toHexString(data)
      }
      return this.key?.toLowerCase()
    },

    isBech32Pub() {
      if (this.isBeck32Key(this.key)) {
        let { prefix } = decode(this.key.toLowerCase())
        return prefix === 'npub'
      }
      return false
    },

    isBech32Sec() {
      if (this.isBeck32Key(this.key)) {
        let { prefix } = decode(this.key.toLowerCase())
        return prefix === 'nsec'
      }
      return false
    },
  },

  async created() {
    if (!this.$store.state.keys.pub) {
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

    generate() {
      this.key = generatePrivateKey()
      this.watchOnly = false
      this.focusKeyInput()
    },

    proceed() {
      let key = this.hexKey

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
      if (key?.toLowerCase()?.match(/^[0-9a-f]{64}$/)) return true
      return false
    },

    isBeck32Key(key) {
      if (typeof key !== 'string') return false
      try {
        let { prefix, data } = decode(key.toLowerCase())
        if (!['npub', 'nsec'].includes(prefix)) return false
        if (prefix === 'npub') this.watchOnly = true
        if (prefix === 'nsec') this.watchOnly = false
        if (!this.isKey(this.toHexString(data))) return false
      } catch (error) {
        return false
      }
      return true
    },

    toHexString(buffer) {
      return buffer.reduce((s, byte) => {
        let hex = byte.toString(16)
        if (hex.length === 1) hex = '0' + hex
        return s + hex
      }, '')
    }
  },
})
</script>

<style>
</style>
