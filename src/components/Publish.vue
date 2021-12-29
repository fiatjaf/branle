<template>
  <q-card class="no-shadow py-6 bg-inherit">
    <q-card-section>
      <q-form @submit="sendPost">
        <q-input v-model="text" dense label="Say something" maxlength="280">
          <template #before>
            <q-avatar
              round
              size="60px"
              class="cursor-pointer mr-4"
              @click="toProfile($store.state.keys.pub)"
            >
              <img :src="$store.getters.avatar($store.state.keys.pub)" />
            </q-avatar>
          </template>
        </q-input>
        <div class="flex justify-end mt-3">
          <q-btn
            v-close-popup
            label="Publish"
            rounded
            unelevated
            type="submit"
            color="primary"
            :disable="!$store.state.keys.priv"
          />
        </div>
      </q-form>
    </q-card-section>
  </q-card>
</template>

<script>
import helpersMixin from '../utils/mixin'

export default {
  mixins: [helpersMixin],

  data() {
    return {
      text: ''
    }
  },
  methods: {
    sendPost() {
      this.$store.dispatch('sendPost', {message: this.text})
      this.text = ''
    }
  }
}
</script>
