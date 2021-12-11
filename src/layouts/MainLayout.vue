<template>
  <q-layout>
    <q-dialog v-model="dialogPublish" position="top">
      <Publish />
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
                :label="$store.getters.displayName($store.state.keys.pub)"
                @click="copyPubKey"
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
              <q-card-section v-if="$store.state.following.length">
                <h6 class="q-ma-none">Following</h6>
                <q-list>
                  <q-item
                    v-for="(_, pubkey) in $store.state.following"
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
                      {{ $store.getters.displayName(pubkey) }}
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
      <div class="text-center">
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
        </q-tabs>
      </div>
    </q-footer>
  </q-layout>
</template>
<script>
import {copyToClipboard} from 'quasar'
import helpersMixin from '../utils/mixin'

export default {
  name: 'MainLayout',
  mixins: [helpersMixin],

  data() {
    return {
      dialogGenerate: false,
      dialogPublish: false,
      addPubKey: ''
    }
  },
  created: function () {
    this.$store.dispatch('launch')
  },
  methods: {
    async copyPubKey() {
      try {
        await copyToClipboard(this.$store.state.keys.pub)
        this.$q.notify({
          message: 'COPIED'
        })
      } catch (err) {
        this.$q.notify({type: 'negative', message: 'FAILED'})
      }
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
