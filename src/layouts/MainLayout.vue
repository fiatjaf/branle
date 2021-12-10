<template>
  <q-layout>
    <q-dialog v-model="dialogPublish" position="top">
      <Publish />
    </q-dialog>

    <q-dialog v-model="dialogGenerate" position="top">
      <Generate />
    </q-dialog>

    <div class="flex-center column">
      <div class="row" style="width: 100%">
        <div
          id="parent"
          class="fit row wrap justify-center items-start content-start"
        >
          <div class="col-4 large-screen-only" style="overflow: auto">
            <q-card
              flat
              no-box-shadow
              class="float-right q-pr-md"
              style="font-size: 20px"
            >
              <q-card-section>
                <img src="~/assets/nostr-logo.png" />
              </q-card-section>
              <q-list class="text-secondary">
                <q-item
                  v-if="$store.getters.disabled"
                  :disabled="$store.getters.disabled"
                  style="padding: 15px"
                >
                  <q-item-section avatar>
                    <q-icon name="home"></q-icon>
                  </q-item-section>

                  <q-item-section>Home</q-item-section>
                </q-item>
                <q-item
                  v-else
                  v-ripple
                  clickable
                  :active="$route.name === 'home'"
                  active-class="my-menu-link"
                  :to="'/'"
                  style="padding: 15px"
                >
                  <q-item-section avatar>
                    <q-icon name="home"></q-icon>
                  </q-item-section>

                  <q-item-section>Home</q-item-section>
                </q-item>

                <q-item
                  v-if="$store.getters.disabled"
                  :disabled="$store.getters.disabled"
                  style="padding: 15px"
                >
                  <q-item-section avatar>
                    <q-icon name="email"></q-icon>
                  </q-item-section>

                  <q-item-section>Messages</q-item-section>
                </q-item>

                <q-item
                  v-else
                  v-ripple
                  clickable
                  :active="$route.name === 'messages'"
                  active-class="my-menu-link"
                  :to="'/messages'"
                  style="padding: 15px; width: 200px"
                >
                  <q-item-section avatar>
                    <q-icon name="email"></q-icon>
                  </q-item-section>

                  <q-item-section>Messages</q-item-section>
                </q-item>

                <q-item
                  v-if="$store.getters.disabled"
                  :disabled="$store.getters.disabled"
                  style="padding: 15px"
                >
                  <q-item-section avatar>
                    <q-icon name="settings"></q-icon>
                  </q-item-section>

                  <q-item-section>Settings</q-item-section>
                </q-item>
                <q-item
                  v-else
                  v-ripple
                  clickable
                  :active="$route.name === 'settings'"
                  active-class="my-menu-link"
                  :to="'/settings'"
                  style="padding: 15px"
                >
                  <q-item-section avatar>
                    <q-icon name="settings"></q-icon>
                  </q-item-section>

                  <q-item-section>Settings</q-item-section>
                </q-item>

                <q-item
                  v-ripple
                  clickable
                  :active="$route.name === 'help'"
                  active-class="my-menu-link"
                  style="padding: 15px"
                  :to="'/help'"
                >
                  <q-item-section avatar>
                    <q-icon name="help"></q-icon>
                  </q-item-section>

                  <q-item-section>Help</q-item-section>
                </q-item>
                <br />
              </q-list>
              <q-btn
                v-if="!$store.getters.disabled"
                rounded
                unelevated
                style="width: 140px !important; height: 41px !important"
                color="primary"
                size="md"
                label="Publish"
                @click="dialogPublish = true"
              ></q-btn>
              <q-btn
                v-else
                rounded
                unelevated
                style="width: 200px !important; height: 82px !important"
                color="primary"
                size="md"
                label="Generate or Restore User Account"
                @click="dialogGenerate = true"
              ></q-btn>
              <br /><br />

              <q-btn
                v-if="!$store.getters.disabled"
                flat
                color="primary"
                size="md"
                dense
                :label="$store.getters.handle($store.state.myProfile.pubkey)"
                @click="copyToClip($store.state.myProfile.pubkey)"
              >
                <q-tooltip> Copy public key </q-tooltip></q-btn
              >
            </q-card>
          </div>

          <div class="col-4 large-screen-only">
            <q-card
              flat
              bordered
              class="no-border-radius"
              style="border-color: #152424"
            >
              <q-card-section>
                <q-page-container>
                  <router-view />
                </q-page-container>
              </q-card-section>
            </q-card>
          </div>

          <div class="col-12 small-screen-only">
            <q-card flat bordered class="no-border-radius">
              <q-card-section>
                <q-page-container>
                  <router-view />
                </q-page-container>
              </q-card-section>
            </q-card>
          </div>

          <div class="col-4 large-screen-only">
            <q-card class="float-left no-shadow">
              <q-card-section>
                <q-form @submit="addPubFollow">
                  <q-input v-model="addPubKey" dense rounded outlined>
                    <template #append>
                      <q-btn
                        round
                        dense
                        flat
                        icon="add"
                        :disabled="$store.getters.disabled"
                        @click="addPubFollow"
                      />
                    </template>
                    <q-tooltip> Add public key to follow </q-tooltip>
                  </q-input>
                </q-form>
              </q-card-section>
              <q-card-section
                v-if="Object.keys($store.state.theirProfile).length"
              >
                <h6 class="q-ma-none">Following</h6>
                <q-list>
                  <q-item
                    v-for="(_, pubkey) in $store.state.theirProfile"
                    :key="pubkey"
                    v-ripple
                    clickable
                    @click="toProfile(pubkey)"
                  >
                    <q-item-section avatar>
                      <q-avatar round>
                        <img :src="$store.getters.avatar(pubkey)" />
                      </q-avatar>
                    </q-item-section>

                    <q-item-section>
                      {{ $store.getters.handle(pubkey) }}
                    </q-item-section>
                  </q-item>
                </q-list>
              </q-card-section>
            </q-card>
          </div>
        </div>
      </div>
    </div>

    <q-footer bordered style="bottom: 0%; position: fixed" class="bg-white">
      <q-banner
        v-if="showInstallBanner"
        inline-actions
        dense
        class="bg-primary text-white"
      >
        <template #avatar>
          <q-avatar>
            <img src="/icons/favicon-16x16.png" />
          </q-avatar>
        </template>
        <b> INSTALL NOSTR?</b>

        <template #action>
          <q-btn
            flat
            dense
            class="q-px-sm"
            label="Yes"
            @click="installApp()"
          ></q-btn>
          <q-btn
            flat
            dense
            class="q-px-sm"
            label="Later"
            @click="showInstallBanner = false"
          ></q-btn>
          <q-btn
            flat
            dense
            class="q-px-sm"
            label="Never"
            @click="neverInstallApp()"
          ></q-btn>
        </template>
      </q-banner>
      <center>
        <q-tabs class="text-primary small-screen-only">
          <q-route-tab style="width: 20%" name="home" icon="home" to="/" />

          <q-route-tab
            style="width: 20%"
            name="messages"
            icon="email"
            to="/messages"
          />
          <q-route-tab
            style="width: 20%"
            name="settings"
            icon="settings"
            to="/settings"
          />
          <q-route-tab style="width: 20%" name="help" icon="help" to="/help" />
        </q-tabs>
      </center>
    </q-footer>
  </q-layout>
</template>
<script>
let deferredPrompt
import {copyToClipboard} from 'quasar'
import helpersMixin from '../utils/mixin'
export default {
  name: 'MainLayout',
  mixins: [helpersMixin],

  data() {
    return {
      showInstallBanner: null,
      dialogGenerate: false,
      dialogPublish: false,
      addPubKey: ''
    }
  },
  mounted() {
    let value = this.$q.localStorage.getItem('neverShowBanner')
    if (!value) {
      window.addEventListener('beforeinstallprompt', e => {
        e.preventDefault()
        deferredPrompt = e
        this.showInstallBanner = true
      })
    }
  },
  created: function () {
    if (this.$store.getters.disabled) {
      this.$router.push('/help')
      return
    }

    this.$store.dispatch('launch')
  },
  methods: {
    installApp() {
      this.showInstallBanner = false
      deferredPrompt.prompt()
      deferredPrompt.userChoice.then(choiceResult => {
        if (choiceResult.outcome === 'accepted') {
          console.log('User accepted the install prompt')
        } else {
          console.log('User dismissed the install prompt')
        }
      })
    },
    neverInstallApp() {
      this.showInstallBanner = false
      try {
        this.$q.localStorage.setItem('neverShowBanner', true)
      } catch (e) {
        console.log(e)
      }
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
    addPubFollow() {
      if (this.addPubKey.trim() !== this.$store.state.myProfile.pubkey) {
        this.$store.dispatch('startFollowing', this.addPubKey.trim())
      } else {
        this.$q.notify({color: 'pink', message: 'You cant follow yourself!'})
      }

      this.addPubKey = ''
    }
  }
}
</script>

<style lang="sass">
.my-menu-link
  color: primary
body.body--dark
    background: #1d2d2d
.small-screen-only
  @media (max-width: $breakpoint-xs-max)
    display: block
  @media (min-width: $breakpoint-sm-min)
    display: none
.large-screen-only
  @media (max-width: $breakpoint-xs-max)
    display: none
  @media (min-width: $breakpoint-sm-min)
    display: block
</style>
