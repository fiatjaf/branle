<template>
  <q-layout class="bg-lime-100">
    <div class="flex">
      <LeftMenu />

      <div class="w-full sm:w-3/4 lg:w-2/4 pl-4">
        <q-page-container>
          <router-view />
        </q-page-container>
      </div>

      <div class="hidden lg:flex w-1/4">
        <q-card class="no-shadow px-4 py-6 bg-inherit">
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
