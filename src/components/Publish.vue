<template>
  <q-card style="width: 100%" class="q-pa-md q-pt-lg no-border-radius" flat>
    <div class="row">
      <q-form style="width: 100%" class="q-gutter-md" @submit="sendPost">
        <q-input
          v-model="text"
          style="font-size: 20px"
          label="Say something"
          maxlength="280"
        >
          <template #before>
            <q-btn round @click="toProfile($store.state.keys.pub)">
              <q-avatar size="42px">
                <img :src="$store.getters.avatar($store.state.keys.pub)" />
              </q-avatar>
            </q-btn>
          </template>
        </q-input>

        <div class="float-right">
          <q-btn
            v-if="text.length < 280"
            class="float-left q-mr-md"
            round
            unelevated
            color="primary"
            icon="insert_emoticon"
            size="sm"
          >
            <q-popup-proxy>
              <q-btn
                v-for="emoji in emojis1"
                :key="emoji.item"
                flat
                rounded
                unelevated
                dense
                @click="text = text + emoji.item"
                >{{ emoji.item }}</q-btn
              >
              <br />
              <q-btn
                v-for="emoji in emojis2"
                :key="emoji.item"
                flat
                rounded
                unelevated
                dense
                @click="text = text + emoji.item"
                >{{ emoji.item }}</q-btn
              >
            </q-popup-proxy>
          </q-btn>
          <q-btn
            v-else
            disable
            class="float-left q-mr-md"
            round
            unelevated
            color="primary"
            icon="insert_emoticon"
            size="sm"
          />

          <q-btn
            label="Publish"
            rounded
            unelevated
            type="submit"
            class="float-right"
            color="primary"
            v-close-popup
          />
        </div>
      </q-form>
    </div>
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
