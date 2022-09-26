<template>
  <q-page>
    <div class="text-h5 text-bold q-py-md full-width flex row justify-start">
      {{ $t('inbox') }}
    </div>
    <q-separator color='accent' size='2px'/>

    <q-list class='q-py-sm q-gutter-sm'>
      <div v-if="loading" class='flex row justify-center items-start q-my-md'>
        <q-spinner-orbit color="accent"  size='md'/>
      </div>
      <q-item
        v-for="chat in chats"
        :key="chat.peer"
        v-ripple
        clickable
        class='flex row no-padding no-margin justify-between items-center q-gutter-xs'
        @click.capture.stop="$router.push({ name: 'messages', params: { pubkey: chat.peer }})"
      >
        <div class='col q-pl-md q-pr-auto flex row'>
          <BaseUserCard v-if='chat.peer' :pubkey='chat.peer' :action-buttons='false' class='col' :clickable='false' :show-following='true'/>
          <q-badge
            v-if="$store.state.unreadMessages[chat.peer]"
            color="secondary"
            outline
            class='text-bold q-my-auto'
          >
            {{ $store.state.unreadMessages[chat.peer] }}
          </q-badge>
        </div>
        <label class='no-padding text-right'>
          {{ niceDateUTC(chat.lastMessage) }}
        </label>
      </q-item>
    </q-list>

    <div v-if='noChats' class="m-8 text-base">
      <p>
        Start a chat by clicking
        <q-icon unelevated color="primary" name="mail_lock" size="md" /> icon on
        someone's profile page or user card.
      </p>
    </div>
  </q-page>
</template>

<script>
import {dbChats} from '../query'
import {streamMessages} from '../query'
import helpersMixin from '../utils/mixin'

export default {
  name: 'Inbox',
  mixins: [helpersMixin],

  data() {
    return {
      chats: [],
      loading: true,
      noChats: false,
      profilesUsed: new Set(),
      sub: null,
    }
  },

  computed: {
    allChatsNeverRead() {
      return Object.keys(this.$store.state.lastMessageRead).length === 0
    }
  },

  async activated() {
    this.chats = await dbChats(this.$store.state.keys.pub)
    if (this.chats.length === 0) this.noChats = true
    this.chats.forEach(({peer}) => this.useProfile(peer))
    if (this.allChatsNeverRead) this.chats.forEach(({peer}) => this.$store.commit('haveReadMessage', peer))
    this.loading = false
    this.sub = await streamMessages(async event => {
      if (event.pubkey === this.$store.state.keys.pub) return
      this.chats = await dbChats(this.$store.state.keys.pub)
      this.useProfile(event.pubkey)
    })
  },

  deactivated() {
    if (this.sub) {
      this.sub.cancel()
      this.sub = null
    }
    this.profilesUsed.forEach(pubkey => this.$store.dispatch('cancelUseProfile', {pubkey}))
  },

  methods: {
    markAllAsRead() {
      this.chats.forEach(chat => {
        this.$store.commit('haveReadMessage', chat.peer)
      })
    },

    useProfile(pubkey) {
      if (this.profilesUsed.has(pubkey)) return

      this.profilesUsed.add(pubkey)
      this.$store.dispatch('useProfile', {pubkey})
    },
  }
}
</script>

<style lang='scss' scoped>
</style>
