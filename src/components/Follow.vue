<template>
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
</template>

<script>
import {queryName} from 'nostr-tools/nip05'

import helpersMixin from '../utils/mixin'

export default {
  mixins: [helpersMixin],

  data() {
    return {
      searchingProfile: ''
    }
  },

  methods: {
    async searchProfile() {
      this.searchingProfile = this.searchingProfile.trim().toLowerCase()

      if (this.searchingProfile.match(/^[a-f0-9A-F]{64}$/)) {
        this.toProfile(this.searchingProfile)
        this.searchingProfile = ''
        return
      }

      if (this.searchingProfile.match(/^([a-z0-9-_.]+@)?[a-z-0-9-_.]+$/)) {
        let pubkey = await queryName(this.searchingProfile)
        if (pubkey) {
          this.toProfile(pubkey)
          this.searchingProfile = ''
          return
        }
      }
    }
  }
}
</script>
