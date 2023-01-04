<template>
  <q-page id='settings-page' @click='closeSelects'>
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
    </q-form>

    <q-separator color='accent'/>

    <div v-if='Object.keys(preferences).length' class='section'>
      <div v-if='editingPreferences' class='flex justify-between' style='display: flex; gap: .2rem;'>
        <q-btn label="save" color="primary" outline size="sm" @click='savePreferences'/>
        <q-btn label="cancel" color="negative" outline size="sm" @click='cancel("preferences")'/>
      </div>
      <div class="text-bold flex justify-between no-wrap" style='font-size: 1.1rem;'>
        {{ $t('preferences') }}
        <div class="text-normal flex row no-wrap" style='font-size: .9rem; gap: .4rem;'>
          <q-btn v-if='!editingPreferences' label="edit" color="primary" outline size="sm" @click='editingPreferences = true'/>
        </div>
      </div>
      <div class="text-bold flex justify-between no-wrap" style='font-size: 1rem;'>
        {{ $t('colors') }}
      </div>
      <div v-if='preferences.color' style='padding-left: .2rem; gap: 1rem;' class='flex row'>
        <div v-for='(colorName, index) in Object.keys(preferences.color)' :key='index' class='flex column items-center'>
          <label :for="colorName">{{ colorName }}</label>
          <input type="color" :id="colorName" :name="colorName" :value='preferences.color[colorName]' :disabled="!editingPreferences" @input='(event) => updateColor(event.target.value, colorName)'>
        </div>
        <!-- <div v-for='(colorName, index) in Object.keys(preferences.color)' :key='index' class='flex column items-center'>
          <label :for="colorName">{{ colorName }}</label> -->
          <BaseSelect :allow-selection='editingPreferences' :selecting='choosingTheme' style='width: 200px;' @toggle='choosingTheme = !choosingTheme'>
            <template #default>{{ 'choose a theme...' }}</template>
            <template #list-items>
              <li v-for='(theme, index) in Object.keys(themes)' :key='index' @click.stop='updateTheme(themes[theme])'>
                <span >{{theme}}</span>
              </li>
            </template>
          </BaseSelect>
        <!-- </div> -->
      </div>
      <div class="text-bold flex justify-between no-wrap" style='font-size: 1rem;'>
        {{ $t('font') }}
      </div>
      <BaseSelect v-if='preferences.font' :allow-selection='editingPreferences' :selecting='choosingFont' style='width: 200px;' @toggle='choosingFont= !choosingFont'>
        <template #default>{{ preferences.font }}</template>
        <template #list-items>
          <li v-for='(font, index) in fonts' :key='index' class='font-item' @click.stop='updateFont(font)'>
            <link :href="`https://fonts.googleapis.com/css2?family=${googleFontsName(font)}`" rel="stylesheet"/>
            <span :style="`font-family: '${font}';`">{{font}}</span>
          </li>
        </template>
      </BaseSelect>

    </div>
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
import { setCssVar } from 'quasar'
import BaseSelect from 'components/BaseSelect.vue'
import BaseSelectMultiple from 'components/BaseSelectMultiple.vue'
import BaseInformation from 'components/BaseInformation.vue'
import { createMetaMixin } from 'quasar'

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
    BaseSelect,
    BaseSelectMultiple,
    BaseInformation,
  },

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
      editingPreferences: false,
      choosingFont: false,
      choosingTheme: false,
      preferences: {},
      newRelay: '',
      unsubscribe: null,
      hasJustSharedRelay: false,
      themes: {
        astral: {
          primary: '#d671ea',
          secondary: '#5af2e0',
          accent: '#ecc865',
          background: '#1f1f1f'
        },
        mono: {
          primary: '#ffffff',
          secondary: '#aaaaaa',
          accent: '#777777',
          background: '#1f1f1f'
        },
        'zen lisa frank': {
          primary: '#14c5d2',
          secondary: '#9c45f2',
          accent: '#f943c9',
          background: '#c7c7c7'
        },
        dusk: {
          primary: '#ff5100',
          secondary: '#b86bff',
          accent: '#8373ff',
          background: '#000082'
        },
        camo: {
          primary: '#67983e',
          secondary: '#686512',
          accent: '#030c06',
          background: '#c5c7b2'
        },
        warm: {
          primary: '#f07575',
          secondary: '#ffb042',
          accent: '#ead04d',
          background: '#756168'
        },
        cool: {
          primary: '#83eefc',
          secondary: '#42a4ff',
          accent: '#a27aff',
          background: '#4a4d59'
        },
        southwest: {
          primary: '#719f9f',
          secondary: '#d27014',
          accent: '#994a00',
          background: '#e8d9b0'
        },
        dracula: {
          primary: '#50fa7b',
          secondary: '#8be9fd',
          accent: '#6272a4',
          background: '#282a36'
        },
        poimandres: {
          primary: '#5de4c7',
          secondary: '#5fa3b4',
          accent: '#acd7ff',
          background: '#1c1e28'
        }
      },
      // fonts: ['Roboto', 'Open Sans', 'Noto Sans JP', 'Montserrat', 'Lato', 'Poppins', 'Roboto Condensed', 'Source Sans Pro', 'Oswald', 'Roboto Mono']
      fonts: ['Roboto', 'Open Sans', 'Noto Sans JP', 'Montserrat', 'Lato', 'Poppins', 'Roboto Condensed', 'Source Sans Pro', 'Oswald', 'Roboto Mono', 'Raleway', 'Inter', 'Noto Sans', 'Ubuntu', 'Nunito', 'Roboto Slab', 'Nunito Sans', 'Playfair Display', 'Merriweather', 'PT Sans', 'Rubik', 'Noto Sans KR', 'Mukta', 'Lora', 'Kanit', 'Work Sans', 'Fira Sans', 'Barlow', 'Noto Sans TC', 'Nanum Gothic', 'Mulish', 'Quicksand', 'Titillium Web', 'PT Serif', 'Hind Siliguri', 'Heebo', 'Libre Franklin', 'DM Sans', 'Noto Serif', 'IBM Plex Sans', 'Karla', 'Josefin Sans', 'Arimo', 'Oxygen', 'Dosis', 'Inconsolata', 'Libre Baskerville', 'Anton', 'Manrope', 'Cairo', 'PT Sans Narrow', 'Secular One', 'Signika Negative', 'Source Serif Pro', 'Bebas Neue', 'Bitter', 'Cabin', 'Dancing Script', 'Abel', 'Hind', 'Barlow Condensed', 'Source Code Pro', 'Prompt', 'EB Garamond', 'Lobster', 'Varela Round', 'Comfortaa', 'Exo 2', 'Fjalla One', 'Pacifico', 'Crimson Text', 'Noto Sans SC', 'Noto Serif JP', 'Slabo 27px', 'Maven Pro', 'Teko', 'Asap', 'Overpass', 'Archivo', 'Caveat', 'Arvo', 'Jost', 'Merriweather Sans', 'Shadows Into Light', 'Abril Fatface', 'Assistant', 'Public Sans', 'M PLUS Rounded 1c', 'Rajdhani', 'Tajawal', 'Space Grotesk', 'Cormorant Garamond', 'Yanone Kaffeesatz', 'Saira Condensed', 'Catamaran', 'Questrial', 'Hind Madurai', 'Indie Flower', 'Fira Sans Condensed', 'IBM Plex Serif', 'Noto Sans HK', 'Alfa Slab One', 'Barlow Semi Condensed', 'Zilla Slab', 'Red Hat Display', 'IBM Plex Mono', 'M PLUS 1p', 'Play', 'Exo', 'Patrick Hand', 'Nanum Myeongjo', 'Domine', 'Signika', 'Chakra Petch', 'Satisfy', 'Permanent Marker', 'Acme', 'Fredoka One', 'Archivo Narrow', 'Sarabun', 'Bree Serif', 'Amatic SC', 'Noto Sans Arabic', 'Alegreya Sans', 'Righteous', 'Russo One', 'Alegreya', 'Vollkorn', 'Didact Gothic', 'ABeeZee', 'Almarai', 'Archivo Black', 'Cinzel', 'Baloo 2', 'Encode Sans', 'Kalam', 'Frank Ruhl Libre', 'Changa', 'Tinos', 'Yantramanav', 'DM Serif Display', 'Noto Serif TC', 'Asap Condensed', 'Amiri', 'Crete Round', 'Ubuntu Condensed', 'Lobster Two', 'Martel', 'Spectral', 'Noto Kufi Arabic', 'Cormorant', 'Courgette', 'Patua One', 'Passion One', 'Alata', 'Space Mono', 'Great Vibes', 'Cardo', 'Prata', 'Rokkitt', 'Sora', 'Fira Sans Extra Condensed', 'Ropa Sans', 'Noticia Text', 'Francois One', 'Old Standard TT', 'Michroma', 'IBM Plex Sans Arabic', 'PT Sans Caption', 'Montserrat Alternates', 'Orbitron', 'Kaushan Script', 'Saira', 'Faustina', 'Concert One', 'Antic Slab', 'Noto Sans Display', 'Yellowtail', 'Unna', 'Chivo', 'Marcellus', 'Gelasio', 'Covered By Your Grace', 'Gothic A1', 'Crimson Pro', 'Sawarabi Mincho', 'Urbanist', 'Carter One', 'Cookie', 'Gloria Hallelujah', 'Pathway Gothic One', 'Mali', 'Rubik Mono One', 'Lexend Deca', 'Press Start 2P', 'News Cycle', 'Sacramento', 'Quattrocento Sans', 'Philosopher']
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
    this.clonePreferences()
  },

  beforeUnmount() {
    if (this.unsubscribe) this.unsubscribe()
  },

  methods: {
    cloneMetadata() {
      this.metadata = JSON.parse(JSON.stringify(this.$store.state.profilesCache[this.$store.state.keys.pub]))
    },
    cloneRelays() {
      // this.relays = JSON.parse(JSON.stringify(this.$store.state.relays))
      this.relays = Object.assign({},
        Object.keys(this.$store.state.relays).length ? this.$store.state.relays : this.$store.state.defaultRelays)
    },
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

      if (!Object.keys(this.$store.state.relays).length) this.saveRelays()
      this.$store.dispatch('setMetadata', this.metadata)
      this.editingMetadata = false
    },
    clonePreferences() {
      this.preferences = JSON.parse(JSON.stringify(this.$store.state.config.preferences))
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
    savePreferences() {
      this.$store.commit('setConfig', {key: 'preferences', value: this.preferences})
      this.editingPreferences = false
    },
    updateColor(color, colorName) {
      setCssVar(colorName, color)
      this.preferences.color[colorName] = color
      if (colorName === 'background') this.$q.dark.set(this.lightOrDark(color) === 'dark')
    },
    updateTheme(theme) {
      for (let colorName of Object.keys(theme)) this.updateColor(theme[colorName], colorName)
    },
    updateFont(font) {
      this.preferences.font = font
      this.$emit('update-font', font)
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
      if (section === 'preferences') {
        this.editingPreferences = false
        this.clonePreferences()
        for (let [colorName, color] of Object.entries(this.preferences.color)) this.updateColor(color, colorName)
        this.updateFont(this.preferences.font)
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
    lightOrDark(color) {
      // Variables for red, green, blue values
      var r, g, b, hsp

      // Check the format of the color, HEX or RGB?
      if (color.match(/^rgb/)) {
          // If RGB --> store the red, green, blue values in separate variables
          color = color.match(/^rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*(\d+(?:\.\d+)?))?\)$/)

          r = color[1]
          g = color[2]
          b = color[3]
      } else {
          // If hex --> Convert it to RGB: http://gist.github.com/983661
          color = +('0x' + color.slice(1).replace(
          color.length < 5 && /./g, '$&$&'))

          r = color >> 16
          g = color >> 8 & 255
          b = color & 255
      }

      // HSP (Highly Sensitive Poo) equation from http://alienryderflex.com/hsp.html
      hsp = Math.sqrt(
      0.299 * (r * r) +
      0.587 * (g * g) +
      0.114 * (b * b)
      )

      // Using the HSP value, determine whether the color is light or dark
      if (hsp > 127.5) {
          return 'light'
      } else {
          return 'dark'
      }
    },
    googleFontsName(font) {
      try {
        return font.replace(' ', '+')
      } catch (e) {
        console.log('error for font ', font)
      }
    },
    closeSelects(e) {
      this.choosingFont = false
      this.choosingTheme = false
    },
  }
}
</script>

<style lang='css' scoped>
.section {
  padding: .5rem;
}
</style>
