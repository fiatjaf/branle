<template>
  <q-page class="px-4 py-6">
    <div class="text-xl">Encrypted Chat</div>

    <q-list v-if="chats.length" class="my-4">
      <q-item
        v-for="chat in chats"
        :key="chat.peer"
        v-ripple
        clickable
        :to="'/messages/' + chat.peer"
      >
        <q-item-section avatar>
          <q-avatar round>
            <img :src="$store.getters.avatar(chat.peer)" />
          </q-avatar>

          <q-badge
            v-if="$store.state.unreadMessages[chat.peer]"
            color="primary"
            floating
            transparent
          >
            {{ $store.state.unreadMessages[chat.peer] }}
          </q-badge>
        </q-item-section>
        <q-item-section>
          <Name :pubkey="chat.peer" fallback />
        </q-item-section>
        <q-item-section side>
          {{ niceDate(chat.lastMessage) }}
        </q-item-section>
      </q-item>
    </q-list>

    <div v-else class="m-8 text-base">
      <p>
        Start a chat by clicking at the
        <q-icon unelevated color="primary" name="message" size="md" /> icon on
        someone's profile page.
      </p>
    </div>
  </q-page>
</template>

<script>
import {dbGetChats} from '../db'
import helpersMixin from '../utils/mixin'

export default {
  name: 'Chats',
  mixins: [helpersMixin],

  data() {
    return {
      chats: []
    }
  },

  async mounted() {
    this.chats = await dbGetChats(this.$store.state.keys.pub)
    this.chats.forEach(({peer}) =>
      this.$store.dispatch('useProfile', {pubkey: peer})
    )
  }
}
</script>
