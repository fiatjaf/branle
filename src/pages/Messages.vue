<template>
  <q-page>
    <center>
      <strong class="text-h6 q-pa-lg">Encrypted Messages</strong>
    </center>
    <q-btn
      v-go-back.single
      flat
      color="white"
      icon="arrow_back"
      label="back"
      class="small-screen-only fixed-top-left"
    />

    <br /><br />
    <p>
      Currently you can only private message a key you are following. <br />All
      private messages are end-to-end encrypted.
    </p>
    <div class="q-mx-auto q-px-md">
      <q-list>
        <q-item
          v-for="(_, followedKey) in $store.state.theirProfile"
          :key="followedKey"
          v-ripple
          clickable
          :to="'/chat/' + followedKey"
        >
          <q-item-section avatar>
            <q-avatar round>
              <img :src="$store.getters.avatar(followedKey)" />
            </q-avatar>
          </q-item-section>

          <q-item-section>{{
            $store.getters.handle(followedKey)
          }}</q-item-section>
        </q-item>
      </q-list>

      <q-footer class="bg-dark q-mb-lg">
        <q-form hidden class="q-gutter-md q-ma-md">
          <div class="row">
            <div class="col-10">
              <q-input
                v-model="pubkey"
                filled
                type="text"
                label="Public key to DM"
              ></q-input>
            </div>
            <div class="col-2">
              <q-btn
                unelevated
                class="q-ma-sm"
                label="Start"
                type="submit"
                color="primary"
              />
            </div>
          </div>
        </q-form>
      </q-footer>
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
