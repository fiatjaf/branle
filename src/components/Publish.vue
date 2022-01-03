<template>
  <q-card class="no-shadow bg-inherit">
    <q-card-section>
      <q-form @submit="sendPost">
        <q-input
          v-model="text"
          dense
          autogrow
          autofocus
          label="Whats happening?"
          maxlength="280"
          class="message-input"
        >
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
            class="publish-button"
            label="Post"
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
<style lang="css">
.message-input .q-field__label {
  font-size: 20px;
  line-height: 22px;
}
.message-input .q-field__control:before {
  border: none;
}
.publish-button .q-btn {
  text-transform: none;
}
</style>
