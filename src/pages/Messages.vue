<template>
  <q-page class="px-4 py-6">
    <div class="text-xl">Encrypted Chat</div>

    <q-separator class="my-6" />

    <q-list>
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

        <q-item-section>{{
          $store.getters.displayName(followedKey)
        }}</q-item-section>
      </q-item>
    </q-list>
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
