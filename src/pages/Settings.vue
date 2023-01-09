<template>
  <q-page id='settings-page'>
    <BaseHeader>{{ $t('settings') }}</BaseHeader>
    <q-form class="q-gutter-md section" @submit="setMetadata">
      <div v-if='editingMetadata' class='flex justify-between' style='display: flex; gap: .2rem;'>
        <q-btn label="save" color="primary" outline size="sm" type="submit"/>
        <q-btn label="cancel" color="negative" outline size="sm" @click='cancel("metadata")'/>
      </div>
      <div class="text-bold flex justify-between no-wrap" style='font-size: 1.1rem;'>
          {{ $t('profile') }}
          <q-btn v-if='!editingMetadata' label="edit" color="primary" outline size="sm" :disable="!$store.getters.canSignEventsAutomatically" @click='editingMetadata = true'/>
      </div>
      <q-input v-model="metadata.name" dense filled type="text" label="Name" :disable='!editingMetadata'>
        <template #before>
          <q-icon name="alternate_email" />
        </template>
      </q-input>
      <q-input
        v-model="metadata.about"
        :disable='!editingMetadata'
        filled
        autogrow
        dense
        type="text"
        label="About (in 150 chars)"
        maxlength="300"
      />
      <q-input
        v-model.trim="metadata.picture"
        :disable='!editingMetadata'
        filled
        dense
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
        dense
        type="text"
        label="NIP-05 Identifier"
        maxlength="100"
      />
      <div class='flex row no-wrap' style='gap: 1rem;'>
        <q-input
          v-model.trim="metadata.lud06"
          :disable='!editingMetadata'
          filled
          dense
          type="text"
          label="Lightning Address or LUD-06 Identifier"
          maxlength="150"
          class='full-width'
        />
        <q-btn v-if='hasLnAddr' :label='showLnAddr ? "show lnurl" : "show ln address"' @click='convertLud06' outline dense no-wrap/>
      </div>
    </q-form>

    <q-separator color='accent'/>
      <ThePreferences @update-font='updateFont'/>
    <q-separator color='accent'/>
    <div class='section'>
      <div v-if='editingRelays' class='flex justify-between' style='display: flex; gap: .2rem;'>
        <q-btn label="save" color="primary" outline size="sm" @click='saveRelays'/>
        <q-btn label="cancel" color="negative" outline size="sm" @click='cancel("relays")'/>
      </div>
      <div class="text-bold flex justify-between no-wrap" style='font-size: 1.1rem;'>
        {{ $t('relays') }}
        <div class="text-normal flex row no-wrap" style='font-size: .9rem; gap: .4rem;'>
          <q-btn v-if='!editingRelays' label="edit" color="primary" outline size="sm" :disable="!$store.getters.canSignEventsAutomatically" @click='editingRelays = true'/>
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
                v-if='!editingRelays && (relays[url].read || relays[url].write)'
                color="secondary"
                outline
                size="sm"
                label="Share"
                :disable="
                  hasJustSharedRelay ||
                  !$store.getters.canSignEventsAutomatically
                "
                @click="shareRelay(url)"
              />
              <q-btn
                v-if='editingRelays'
                color="negative"
                label='remove'
                outline
                size="sm"
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
                :disable="!$store.getters.canSignEventsAutomatically"
              />
              <q-toggle
                v-if='editingRelays'
                v-model='relays[url].write'
                color='primary'
                size='sm'
                dense
                class='no-padding'
                :disable="!$store.getters.canSignEventsAutomatically"
              />
          </div>
        </q-item>
      </q-list>
      <q-form v-if='editingRelays' class='q-py-xs' @submit="addRelay">
          <div class='flex row no-wrap q-mx-sm q-mt-sm' id='new-relay-input'>
            <q-input v-model='newRelay' placeholder='add a relay...' autofocus class='full-width' input-style='padding: 0;' @keypress.enter='addRelay' dense borderless/>
            <q-btn icon='add' color='positive' size='sm' flat dense @click.stop='addRelay'/>
          </div>
        <BaseSelectMultiple>
          <template #options>
            <div style='max-height: 6.75rem;'>
            <pre class='relay-list' >
              <li
                v-for='(relay, index) in optionalRelays'
                :key='index + "-" + relay'
                class='relay-item'
                @click.stop='relays[relay]={read: true, write: true}'
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
      </q-form>
    </div>

    <q-separator color='accent'/>
      <q-expansion-item
        dense
        expand-icon='help'
        expanded-icon='expand_less'
        class="full-width items-center"
        header-class='items-center'
      >
        <template #header>
          <div class="text-bold flex justify-between no-wrap full-width" style='font-size: 1.1rem;'>{{ $t('faq') }}</div>
        </template>
        <q-card-section>
        <BaseInformation/>
        </q-card-section>
      </q-expansion-item>
    <q-separator color='accent'/>

    <div class="flex no-wrap section" style='gap: .2rem;'>
      <q-btn label="View your keys" color="primary" outline @click="keysDialog = true" />
      <q-btn label="logout" color="primary" outline @click="logout" />
      <q-btn label="Delete Local Data" color="negative" outline @click="hardReset" />
      <q-btn label="dev tools" color='secondary' outline :to='{ name: "devTools"}' />
    </div>

    <q-dialog v-model="keysDialog">
      <q-card class="px-4 py-2">
        <q-card-section>
          <div class="text-lg text-bold tracking-wide leading-relaxed py-2">
            Your keys <q-icon name="vpn_key" />
          </div>
          <p v-if="$store.state.keys.priv">Make sure you back up your private key!</p>
          <p v-else>Your private key is not here!</p>
          <div class="mt-1 text-xs">
            Posts are published using your private key. Others can see your
            posts or follow you using only your public key.
          </div>
        </q-card-section>

        <q-card-section>
          <p>Private Key:</p>
          <q-input
            v-model="nsecKey"
            class="mb-2"
            readonly
            filled
          />
          <p>Public Key:</p>
          <q-input v-model="npubKey" readonly filled />
        </q-card-section>

        <q-card-actions align="right" class="text-primary">
          <q-btn v-close-popup outline label="Close" />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script>
import {LocalStorage} from 'quasar'
import {nextTick} from 'vue'
import {queryName} from 'nostr-tools/nip05'
// import fetch from 'cross-fetch'

import helpersMixin from '../utils/mixin'
import {dbErase} from '../query'
// import { setCssVar } from 'quasar'
// import BaseSelect from 'components/BaseSelect.vue'
import BaseSelectMultiple from 'components/BaseSelectMultiple.vue'
import BaseInformation from 'components/BaseInformation.vue'
import ThePreferences from 'components/ThePreferences.vue'
import { createMetaMixin } from 'quasar'
import { utils } from 'lnurl-pay'

const metaData = {
  // sets document title
  title: 'astral - settings',

  // meta tags
  meta: {
    description: { name: 'description', content: 'Nostr and astral user configuration' },
    keywords: { name: 'keywords', content: 'nostr decentralized social media' },
    equiv: { 'http-equiv': 'Content-Type', content: 'text/html; charset=UTF-8' },
  },
}

export default {
  name: 'Settings',
  mixins: [helpersMixin, createMetaMixin(metaData)],
  emits: ['update-font'],
  components: {
    // BaseSelect,
    BaseSelectMultiple,
    BaseInformation,
    ThePreferences,
  },

  data() {
    return {
      keysDialog: false,
      editingMetadata: false,
      metadata: {},
      showLnAddr: true,
      relays: {},
      editingRelays: false,
      // editingPreferences: false,
      choosingFont: false,
      choosingTheme: false,
      // preferences: {},
      newRelay: '',
      unsubscribe: null,
      hasJustSharedRelay: false,
    }
  },

  // props: {
  //   showKeys: {
  //     type: Boolean,
  //     default: false
  //   }
  // },

  watch: {
    '$store.state.relays'(curr, prev) {
      if (curr !== prev) this.cloneRelays()
    },
  },
  computed: {
    optionalRelays() {
      let options = this.$store.state.optionalRelaysList.filter(relay => {
        if (this.newRelay.length && !relay.toLowerCase().includes(this.newRelay.toLowerCase())) return false
        if (this.relays[relay]) return false
        return true
      })
      return options
    },
    npubKey() {
      if (this.$store.state.keys.pub) return this.hexToBech32(this.$store.state.keys.pub, 'npub')
      return null
    },
    nsecKey() {
      if (this.$store.state.keys.priv) return this.hexToBech32(this.$store.state.keys.priv, 'nsec')
      return null
    },
    hasLnAddr() {
      return utils.isLightningAddress(this.metadata.lud06) || (utils.isLnurl(this.metadata.lud06) && this.lnurlToLnAddr(this.metadata.lud06))
    },
    isLnurl() {
      return utils.isLnurl(this.metadata.lud06)
    }
  },

  mounted() {
    if (!this.$store.state.keys.pub) this.$router.push('/')
    if (this.$store.state.keys.pub && this.$route.params.initUser) {
          nextTick(() => {
            setTimeout(() => {
              this.keysDialog = true
            }, 1000)
          })
    }

    this.unsubscribe = this.$store.subscribe((mutation, state) => {
      switch (mutation.type) {
        case 'addProfileToCache': {
          if (mutation.payload.pubkey !== state.keys.pub) return

          nextTick(() => {
            setTimeout(() => {
              this.cloneMetadata()
            }, 1)
          })

          break
        }
        // case 'setKeys': {
        //   nextTick(() => {
        //     setTimeout(() => {
        //       this.keysDialog = true
        //     }, 1)
        //   })
        //   break
        // }
      }
    })
    this.cloneRelays()
  },

  beforeUnmount() {
    if (this.unsubscribe) this.unsubscribe()
  },

  methods: {
    cloneMetadata() {
      this.metadata = Object.assign({}, this.$store.state.profilesCache[this.$store.state.keys.pub])
      // this.metadata = {name, picture, about, nip05}
      if (this.metadata.lud06) {
        let lnAddr = this.lnurlToLnAddr(this.metadata.lud06)
        if (lnAddr) this.metadata.lud06 = lnAddr
      } else if (this.metadata.lud16) {
        this.metadata.lud06 = this.metadata.lud16
      }
    },
    convertLud06() {
      if (utils.isLightningAddress(this.metadata.lud06)) this.metadata.lud06 = this.lnAddrToLnurl(this.metadata.lud06)
      else if (utils.isLnurl(this.metadata.lud06) && this.lnurlToLnAddr(this.metadata.lud06)) this.metadata.lud06 = this.lnurlToLnAddr(this.metadata.lud06)
      this.showLnAddr = !this.showLnAddr
    },
    cloneRelays() {
      // this.relays = JSON.parse(JSON.stringify(this.$store.state.relays))
      this.relays = Object.assign({},
        Object.keys(this.$store.state.relays).length ? this.$store.state.relays : this.$store.state.defaultRelays)
    },
    async setMetadata() {
      if (this.metadata.created_at) delete this.metadata.created_at
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

      if (this.metadata.lud06) {
        if (utils.isLightningAddress(this.metadata.lud06)) {
          this.metadata.lud16 = this.metadata.lud06
          this.metadata.lud06 = this.lnAddrToLnurl(this.metadata.lud16)
        } else {
          let lnAddr = this.lnurlToLnAddr(this.metadata.lud06)
          if (lnAddr) this.metadata.lud16 = lnAddr
        }
        if (!utils.isLnurl(this.metadata.lud06)) {
          this.$q.notify({
            message: 'Invalid lud06 identifier, must start with LNURL.',
            color: 'warning'
          })
          return
        }
        if (this.metadata.lud16 && !utils.isLightningAddress(this.metadata.lud16)) {
          this.$q.notify({
            message: 'Invalid lud16 identifier, must be a lightning address.',
            color: 'warning'
          })
          return
        }
      }

      if (!Object.keys(this.$store.state.relays).length) this.saveRelays()
      this.$store.dispatch('setMetadata', this.metadata)
      this.editingMetadata = false
    },
    addRelay() {
      if (this.newRelay && this.newRelay.length) this.relays[this.newRelay] = { read: true, write: true }
      this.newRelay = ''
    },
    removeRelay(url) {
      delete this.relays[url]
    },
    saveRelays() {
      if (!Object.keys(this.relays).length) {
        this.$q
        .dialog({
          title: 'no relays saved!',
          message: 'you must have at least one relay selected to save. please add a relay.',
          ok: {color: 'accent'}
        })
        .onOk(() => {
          return
        })
        return
      }
      if (this.$store.getters.canSignEventsAutomatically) this.$store.commit('saveRelays', this.relays)
      this.editingRelays = false
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
      // if (section === 'preferences') {
      //   this.editingPreferences = false
      //   this.clonePreferences()
      //   for (let [colorName, color] of Object.entries(this.preferences.color)) this.updateColor(color, colorName)
      //   this.updateFont(this.preferences.font)
      //   return
      // }
    },
    shareRelay(url) {
      this.hasJustSharedRelay = true
      this.$store.dispatch('recommendRelay', url)
      setTimeout(() => {
        this.hasJustSharedRelay = false
      }, 5000)
    },
    async logout() {
      this.$q
        .dialog({
          title: 'logout?',
          message: 'this will not delete your local nostr database but will allow you to login as another user. continue?',
          cancel: {color: 'accent'},
          ok: {color: 'accent'}
        })
        .onOk(async () => {
          LocalStorage.clear()
          window.location.reload()
        })
    },
    async hardReset() {
      this.$q
        .dialog({
          title: 'delete all data?',
          message: 'do you really want to delete all data from this device?',
          cancel: {color: 'accent'},
          ok: {color: 'accent'}
        })
        .onOk(async () => {
          LocalStorage.clear()
          await dbErase()
          window.location.reload()
        })
    },
    updateFont(font) {
      // this.preferences.font = font
      this.$emit('update-font', font)
    },
  }
}
</script>

<style lang='css' scoped>
.section {
  padding: .5rem;
}
</style>
