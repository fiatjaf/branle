<template>
  <q-card class="no-shadow p-8">
    <q-card-section>
      <q-form @submit="sendPost">
        <q-input v-model="text" dense label="Say something" maxlength="280">
          <template #before>
            <q-btn round class="mr-3" @click="toProfile($store.state.keys.pub)">
              <q-avatar round size="42px">
                <img :src="$store.getters.avatar($store.state.keys.pub)" />
              </q-avatar>
            </q-btn>
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
