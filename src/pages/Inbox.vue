<template>
  <q-page>
    <div class="text-h5 text-bold q-py-md full-width flex row justify-start">
      {{ $t('inbox') }}
      <!-- <q-btn
        v-if='allChatsNeverRead'
        label="mark all as read"
        color="secondary"
        class='q-ml-lg'
        outline
        dense
        @click.stop='markAllAsRead'
      /> -->
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
        :to="{ name: 'messages', params: { pubkey: chat.peer }}"
      >
        <div class='col q-pl-md q-pr-auto flex row' style='max-width: 350px; width: 350px;'>
        <BaseUserCard v-if='chat.peer' :pubkey='chat.peer' :action-buttons='false' class='col' :clickable='false'/>
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
      <!-- :button-to="'/messages/' + pubkey" -->

<script>
import {dbGetChats} from '../db'
import helpersMixin from '../utils/mixin'

export default {
  name: 'Inbox',
  mixins: [helpersMixin],

  data() {
    return {
      chats: [],
      loading: true,
      noChats: false,
    }
  },

  computed: {
    allChatsNeverRead() {
      return Object.keys(this.$store.state.lastMessageRead).length === 0
    }
  },

  async mounted() {
    this.chats = await dbGetChats(this.$store.state.keys.pub)
    if (this.chats.length === 0) this.noChats = true
    this.chats.forEach(({peer}) =>
      this.$store.dispatch('useProfile', {pubkey: peer})
    )
    if (this.allChatsNeverRead) this.chats.forEach(({peer}) => this.$store.commit('haveReadMessage', peer))
    this.loading = false
  },

  methods: {
    markAllAsRead() {
      this.chats.forEach(chat => {
        this.$store.commit('haveReadMessage', chat.peer)
      })
    }
  }
}
</script>

<style lang='scss' scoped>
</style>
