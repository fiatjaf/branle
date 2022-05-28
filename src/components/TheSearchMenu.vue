<template>
  <div class='fit flex column no-wrap'>
    <q-card-section class='q-pa-sm'>
      <q-form
        @submit="searchProfile"
      >
        <q-input
          v-model="searchingProfile"
          class='no-padding searchingProfile'
          outlined
          label='search profiles'
          dense
          color='secondary'
          :hint='validSearch ? "enter user public key or NIP05 identifier" : "INVALID FORMAT! enter user public key or NIP05 identifier"'
          hide-hint
          hide-bottom-space
          :input-style='!validSearch ? "color: #ff0000" : ""'
          :loading='searching'
          @clear.stop='searchingProfile=""'
          @submit="searchProfile"
          @keypress.ctrl.enter="searchProfile"
        >
          <template #append>
            <BaseButtonClear :button-text='searchingProfile' button-class='text-secondary' @clear='searchingProfile=""'/>
            <q-btn
              text-color='secondary'
              class='q-pa-xs'
              icon="search"
              type="submit"
              unelevated
              :disable='!validSearch || searching'
              @click="searchProfile"
            />
          </template>
        </q-input>
      </q-form>
    <div v-if='domainMode'>
      <div class='flex row justify-between no-wrap'>
        <h2 class='text-h6 text-bold q-my-none'> {{ domain }} users</h2>
        <q-btn icon='close' @click.stop='domainMode = false' />
      </div>
      <div v-if='domainDefaultPubkey'>
        <h2 class='text-caption text-bold q-my-none'> NIP05 maintainer </h2>
        <BaseUserCard :pubkey='domainDefaultPubkey'/>
      </div>
        <q-list class='q-pt-xs q-pl-sm' style='overflow-y: auto; max-height: 40vh;'>
          <div v-for="user in domainUsers" :key="user.pubkey">
            <!-- <h2 class='text-caption text-bold q-my-none'> {{user.name}} </h2> -->
            <BaseUserCard :pubkey="user.pubkey" />
          </div>
        </q-list>
        <q-separator color='accent' />
    </div>
    </q-card-section>
      <div class='flex row justify-between no-wrap'>
        <h2 class='text-h5 text-bold q-my-none'> following </h2>
        <div>
          <q-btn v-if='!reordering' flat icon='reorder' @click.stop='reorderFollowing'>
            <q-tooltip>reorder following list</q-tooltip>
          </q-btn>
          <q-btn v-if='reordering' flat icon='close' @click.stop='cancelReorder'>
            <q-tooltip>cancel</q-tooltip>
          </q-btn>
        </div>
      </div>
    <q-card-section class='no-padding' style='overflow-y: auto;'>
      <div v-if='$store.state.following.length' class='q-mt-xs q-pl-sm'>
        <q-list v-if="!reordering">
          <BaseUserCard
            v-for="pubkey in $store.state.following"
            :pubkey="pubkey"
            :key="pubkey"
          />
        </q-list>
        <Draggable
          v-else-if='reorderedFollowing.length'
          v-model='reorderedFollowing'
          @start="dragging=true"
          @end="dragging=false"
          item-key="pubkey"
        >
            <!-- <div>{{element.name}}</div> -->
          <template #header>
            <div class='flex row justify-between items-start'>
              <span>drag and drop to reorder</span>
              <q-btn outline size='sm' icon='save' label='save' color='secondary' @click.stop='saveReorder'/>
            </div>
          </template>
          <template #item="{element}">
            <BaseUserCard :pubkey='element.pubkey' :action-buttons='false'/>
          </template>
              <!-- <BaseUserCard :clickable='false' :pubkey="element.pubkey" /> -->
        </Draggable>
      </div>
      <div v-else>
        When you follow someone they will show up here.
      </div>
    </q-card-section>
  </div>
</template>

<script>
import { defineComponent } from 'vue'
import {Notify} from 'quasar'
import Draggable from 'vuedraggable'
import {searchDomain, queryName} from 'nostr-tools/nip05'
import helpersMixin from '../utils/mixin'
import BaseButtonClear from 'components/BaseButtonClear.vue'

export default defineComponent({
  name: 'TheSearchMenu',
  mixins: [helpersMixin],

  data() {
    return {
      searchingProfile: '',
      searching: false,
      domainMode: false,
      domainNames: {},
      reordering: false,
      reorderedFollowing: [],
      dragging: false,
    }
  },

  components: {
    BaseButtonClear,
    Draggable,
  },

  computed: {
    validSearch() {
      if (this.searchingProfile === '') return true
      if (this.searchingProfile.match(/^[a-f0-9A-F]{64}$/)) return true
      if (this.searchingProfile.match(/^([a-z0-9A-Z-_.\u00C0-\u1FFF\u2800-\uFFFD]*@)?[a-z0-9A-Z-_]+[.]{1}[a-z0-9A-Z-_.]+$/)) return true
      return false
    },
    domainDefaultPubkey() {
      return this.domainNames._
    },
    domainUsers() {
      let users = Object.keys(this.domainNames).filter((name) => name !== '_').map((name) => { return { 'name': name, 'pubkey': this.domainNames[name] } })
      return users
    },
    domain() {
      let [name, domain] = this.searchingProfile.split('@')
      return domain || name
    }
  },

  methods: {

    async searchProfile() {
      if (!this.validSearch) {
        Notify.create({
          message: 'Invalid format! Please enter full public key or NIP05 identifier',
          color: 'negative'
        })
        return
      }

      this.searching = true
      this.searchingProfile = this.searchingProfile.trim().toLowerCase()

      if (this.searchingProfile.match(/^[a-f0-9]{64}$/)) {
        this.toProfile(this.searchingProfile)
        this.searchingProfile = ''
        this.searching = false
        return
      }

      if (this.searchingProfile.match(/^([a-z0-9-_.\u00C0-\u1FFF\u2800-\uFFFD]*@)?[a-z0-9-_.]+[.]{1}[a-z0-9-_.]+$/)) {
        // if (!this.searchingProfile.match(/^[a-z0-9-_.\u00C0-\u1FFF\u2800-\uFFFD]?@/)) {
          if (this.searchingProfile.match(/^@/) || !this.searchingProfile.match(/@/)) {
          //   this.searchingProfile = '_' + this.searchingProfile
          // else if (!this.searchingProfile.match(/@/)) this.searchingProfile = '_@' + this.searchingProfile
          this.domainNames = await searchDomain(this.domain)
          // this.domainUsers
          if (this.domainUsers.length || this.domainDefaultPubkey) {
            if (this.domainDefaultPubkey) {
              this.$store.dispatch('useProfile', {
                pubkey: this.domainDefaultPubkey,
                request: true
              })
            }
            if (this.domainUsers.length) {
              this.domainUsers.forEach((user) => {
                this.$store.dispatch('useProfile', {
                  pubkey: user.pubkey,
                  request: true
                })
              })
            }
            this.searching = false
            this.domainMode = true
            return
          }
          }
        // }
        console.log('this.domainUsers', this.domainUsers)
        let pubkey = await queryName(this.searchingProfile)
        console.log('queryName returned: ', pubkey)
        if (pubkey) {
          this.toProfile(pubkey)
          this.searchingProfile = ''
          this.searching = false
          return
        }
      }
      this.searching = false
      Notify.create({
        message: 'No user found! Please enter full public key or NIP05 identifier and double check search string',
        color: 'negative'
      })
    },

    reorderFollowing() {
      this.reorderedFollowing = this.$store.state.following.map((pubkey) => { return {pubkey} })
      this.reordering = true
    },

    saveReorder() {
      this.$store.commit('reorderFollows', this.reorderedFollowing.map(follow => follow.pubkey))
      this.reordering = false
      this.reorderedFollowing = []
    },

    cancelReorder() {
      this.reordering = false
      this.reorderedFollowing = []
    }
  }
})
</script>
