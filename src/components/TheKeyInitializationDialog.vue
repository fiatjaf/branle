<template>
  <!-- <q-dialog persistent> -->
  <!-- <div v-if="showKeyInitialization"> -->
    <q-card class='relative-position full-width'>
      <q-btn icon='close' size='md' flat round class='absolute-top-right z-top' @click='$emit("look-around")'/>
      <h1 class="text-h6 q-pr-md">welcome to astral</h1>
      <q-expansion-item
        dense
        expand-icon='help'
        expanded-icon='expand_less'
        class="intro no-padding full-width items-center"
        header-class='items-center'
      >
        <template #header>
          <span class='full-width'>click here to learn about Nostr, your keys, and how to use astral</span>
        </template>
        <BaseInformation/>
        <span style='padding: .2rem 0 0 .2rem;'>note: after login this same information can be found in
        the <strong>faq</strong> section at the bottom of the settings page</span>
      </q-expansion-item>
      <h2 class="text-subtitle2 q-pr-md">enter your key</h2>
      <q-form @submit="proceed">
        <q-card-section class="key-entry no-padding">
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
                v-if="!isKeyValid"
                size="sm"
                color="primary"
                outline
                @click="generate"
              >
                generate keys
              </q-btn>
              <q-btn
                v-if="hasExtension && !isKeyValid"
                size="sm"
                color="primary"
                outline
                @click="getFromExtension"
              >
                use public key from extension
              </q-btn>
              <q-btn
                type="submit"
                unelevated
                size="sm"
                color="positive"
                :label="isKeyValid ? 'proceed' : ''"
                icon-right="login"
                style='color: var(--q-background) !important;'
                @click="proceed"
                :disabled="!isKeyValid"
              ></q-btn>
            </template>
          </q-input>
        </q-card-section>
      <!-- <div v-if='isBeck32Key(key)'>
      {{ hexKey }}
      </div> -->
      </q-form>
      <q-expansion-item
        v-if='isKeyValid'
        dense
        dense-toggle
        default-opened
        id='bootstrap-relays'
      >
        <template #header>
          <div class='full-width flex row no-wrap items-center'>
            <h2 class="text-subtitle2 q-pr-md">enter bootstrap relays (optional)</h2>
            <q-icon name='info'>
              <q-tooltip>
              the selected relays below will be queried to load your user profile, follows, and relay data from Nostr network.
              please ensure the list of selected relays includes relays you publish your Nostr data to, otherwise astral may
              not be able to find your data.
              </q-tooltip>
            </q-icon>
          </div>
        </template>
        <div class='flex row justify-between no-wrap items-end' >
          <span>selected relays</span>
          <div class='flex row items-end' id='new-relay-input'>
            <q-input v-model='newRelay' placeholder='add a relay...' input-style='padding: 0; width: 10rem;' @keypress.enter='addNewRelay' dense borderless/>
            <q-btn icon='add' color='positive' size='sm' flat dense @click.stop='addNewRelay'/>
          </div>
        </div>
        <BaseSelectMultiple>
          <template #selected>
            <pre class='relay-list' style='border: 1px solid var(--q-primary);'>
              <li
                v-for='(relay, index) in Object.keys(selectedRelays)'
                :key='index + "-" + relay'
                class='relay-item'
                @click.stop='delete selectedRelays[relay]'
              >
                <div class='flex row justify-between no-wrap'>
                  <span style='overflow: auto;'>{{relay}}</span>
                  <q-icon name='remove' size='xs' color='negative'/>
                </div>
              </li>
            </pre>
          </template>
          <template #options>
            <div style='max-height: 6.75rem;'>
            <pre class='relay-list' >
              <li
                v-for='(relay, index) in optionalRelays'
                :key='index + "-" + relay'
                class='relay-item'
                @click.stop='selectedRelays[relay]={read: true, write:false}'
              >
                <div class='flex row justify-between no-wrap'>
                  <span style='overflow: auto;'>{{relay}}</span>
                  <q-icon name='add' size='xs' color='positive' flat/>
                </div>
              </li>
            </pre>
            </div>
          </template>
        </BaseSelectMultiple>
      </q-expansion-item>
      <div style='min-height: 1rem;'/>
    </q-card>
  <!-- </div> -->
  <!-- </q-dialog> -->
</template>

<script>
import { defineComponent } from 'vue'
import helpersMixin from '../utils/mixin'
import { validateWords } from 'nostr-tools/nip06'
import { generatePrivateKey } from 'nostr-tools'
import { decode } from 'bech32-buffer'
import BaseSelectMultiple from 'components/BaseSelectMultiple.vue'
import BaseInformation from 'components/BaseInformation.vue'

export default defineComponent({
  name: 'TheKeyInitializationDialog',
  mixins: [helpersMixin],
  emits: ['look-around'],

  components: {
    BaseSelectMultiple,
    BaseInformation,
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
      selectedRelays: this.$store.state.defaultRelays,
      newRelay: '',
    }
  },

  computed: {
    icon() {
      return document.getElementById('icon').href
    },

    // showKeyInitialization() {
    //   if (['profile', 'event', 'hashtag', 'feed'].includes(this.$route.name)) return false
    //   return true
    // },

    isKeyKey() {
      if (this.isKey(this.hexKey)) return true
      return false
    },

    isKeyValid() {
      if (this.isKeyKey) return true
      if (validateWords(this.key?.toLowerCase())) return true
      return false
    },

    isKeyInvalid() {
      return !this.isKeyValid
    },

    hexKey() {
      // npub1xtscya34g58tk0z605fvr788k263gsu6cy9x0mhnm87echrgufzsevkk5s
      // nsec1xtscya34g58tk0z605fvr788k263gsu6cy9x0mhnm87echrgufzs46ahj9
      // 32e1827635450ebb3c5a7d12c1f8e7b2b514439ac10a67eef3d9fd9c5c68e245
      if (this.isBeck32Key(this.key)) {
        return this.beck32ToHex(this.key)
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

    optionalRelays() {
      let options = this.$store.state.optionalRelaysList.filter(relay => {
        if (this.newRelay.length && !relay.toLowerCase().includes(this.newRelay.toLowerCase())) return false
        if (this.selectedRelays[relay]) return false
        return true
      })
      return options
    }
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

      this.$store.commit('setDefaultRelays', this.selectedRelays)
      this.$store.dispatch('initKeys', keys)
      this.$store.dispatch('launch')
      this.initializeKeys = false
      this.$router.push({
        name: 'settings',
        params: { initUser: true },
      })
    },

    addNewRelay() {
      if (this.newRelay && this.newRelay.length) this.selectedRelays[this.newRelay] = {read: true, write: false}
      this.newRelay = ''
    }
  },
})
</script>

<style lang='css' scoped>
.q-card {
  background: var(--q-background);
  padding: 1rem;
}
</style>

<style lang='css'>
.relay-list {
  column-width: 15rem;
  column-gap: .5rem;
  width: 100%;
  min-height: 1px;
  font-size: .8rem;
  white-space: nowrap;
  padding: 0 .5rem;
  border-radius: .5rem;
  overflow-y: auto;
  overflow-x: hidden;
}
.relay-item {
  overflow: auto;
}
#new-relay-input {
   background: rgba(0, 0, 0, 0.05);
   border-radius: .3rem;
   padding: 0 0 0 .5rem;
}
.body--dark #new-relay-input {
   background: rgba(255, 255, 255, 0.08);
}
#new-relay-input .q-field--dense .q-field__control {
  height: 1.4rem !important;
}
</style>
