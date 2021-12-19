<template>
  <q-layout>
    <q-dialog v-model="dialogPublish">
      <Publish />
    </q-dialog>

    <div class="flex">
      <div class="hidden sm:flex w-1/4 justify-center px-8">
        <q-card flat no-box-shadow class="text-xl">
          <q-card-section class="flex justify-center">
            <q-img src="/bird.png" fit="scale-down" width="80px" />
          </q-card-section>
          <q-list class="text-slate-700">
            <q-item v-ripple clickable :to="'/'" active-class="">
              <q-item-section avatar>
                <q-icon name="home" color="secondary" />
              </q-item-section>

              <q-item-section
                :class="{
                  'text-primary': $route.name === 'home'
                }"
              >
                Home
              </q-item-section>
            </q-item>

            <q-item v-ripple clickable :to="'/messages'" active-class="">
              <q-item-section avatar>
                <q-icon name="email" color="secondary" />
              </q-item-section>

              <q-item-section
                :class="{'text-primary': $route.name === 'messages'}"
              >
                Messages
              </q-item-section>
            </q-item>

            <q-item
              v-ripple
              clickable
              :to="'/' + $store.state.keys.pub"
              active-class=""
            >
              <q-item-section avatar>
                <q-icon name="person" color="secondary" />
              </q-item-section>

              <q-item-section
                :class="{
                  'text-primary':
                    $route.name === 'profile' &&
                    $route.params.pubkey === $store.state.keys.pub
                }"
              >
                Profile
              </q-item-section>
            </q-item>

            <q-item v-ripple clickable :to="'/settings'" active-class="">
              <q-item-section avatar>
                <q-icon name="settings" color="secondary" />
              </q-item-section>

              <q-item-section
                :class="{'text-primary': $route.name === 'settings'}"
              >
                Settings
              </q-item-section>
            </q-item>
          </q-list>

          <div class="flex justify-center">
            <q-btn
              rounded
              unelevated
              color="primary"
              size="md"
              label="Publish"
              class="mx-2 my-4 py-2 px-4 w-full"
              @click="dialogPublish = true"
            ></q-btn>
          </div>
        </q-card>
      </div>

      <div class="w-full sm:w-3/4 lg:w-2/4">
        <q-page-container>
          <router-view />
        </q-page-container>
      </div>

      <div class="hidden lg:flex w-1/4">
        <q-card class="no-shadow px-4 py-6">
          <q-card-section>
            <q-form class="mb-6" @submit="searchProfile">
              <div>
                <q-input
                  v-model="searchingProfile"
                  filled
                  label="Search a Profile"
                  clearable
                >
                  <template #append>
                    <q-btn
                      icon="search"
                      type="submit"
                      color="primary"
                      class="ml-3"
                      @click="searchProfile"
                    />
                  </template>
                </q-input>
              </div>
            </q-form>
            <div class="text-lg">Following</div>
            <q-list v-if="$store.state.following.length">
              <q-item
                v-for="pubkey in $store.state.following"
                :key="pubkey"
                v-ripple
                clickable
                @click="toProfile(pubkey)"
              >
                <q-item-section avatar>
                  <q-avatar rounded>
                    <img :src="$store.getters.avatar(pubkey)" />
                  </q-avatar>
                </q-item-section>

                <q-item-section>
                  {{ $store.getters.displayName(pubkey) }}
                </q-item-section>
              </q-item>
            </q-list>
            <div v-else class="my-3">
              When you follow someone they will show up here.
            </div>
          </q-card-section>
        </q-card>
      </div>
    </div>
  </q-layout>
</template>
<script>
import helpersMixin from '../utils/mixin'

export default {
  name: 'MainLayout',
  mixins: [helpersMixin],

  data() {
    return {
      dialogGenerate: false,
      dialogPublish: false,
      searchingProfile: ''
    }
  },
  created: function () {
    this.$store.dispatch('launch')
  },
  methods: {
    async searchProfile() {
      if (this.searchingProfile.match(/[a-f0-9A-F]{64}/)) {
        this.toProfile(this.searchingProfile)
        this.searchingProfile = ''
      }
    }
  }
}
</script>
