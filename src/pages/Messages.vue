<template>
  <q-page class="px-4 py-6">
    <div class="text-xl">Encrypted Chat</div>

    <q-list v-if="$store.state.following.length" class="my-4">
      <q-item
        v-for="followedKey in $store.state.following"
        :key="followedKey"
        v-ripple
        clickable
        :to="'/messages/' + followedKey"
      >
        <q-item-section avatar>
          <q-avatar round>
            <img :src="$store.getters.avatar(followedKey)" />
          </q-avatar>
        </q-item-section>

        <q-item-section>
          {{ $store.getters.displayName(followedKey) }}
        </q-item-section>
      </q-item>
    </q-list>

    <div v-else class="m-8 text-base">
      <p>Start following some people to initiate chats.</p>
    </div>
  </q-page>
</template>

<script>
import helpersMixin from '../utils/mixin'

export default {
  name: 'Messages',
  mixins: [helpersMixin],

  data() {
    return {
      pubkey: '',
      text: ''
    }
  }
}
</script>
