<template>
  <q-page>
    <center>
      <strong class="text-h6 q-pa-lg">Help</strong>
    </center>
    <br />
    <q-btn
      v-go-back.single
      flat
      color="white"
      icon="arrow_back"
      label="back"
      class="small-screen-only fixed-top-left"
    />
    <br /><br />

    <strong>What is Nostr (Notes and other stuff relays)?</strong><br /><br />
    <p>
      Nostr is a decentralised collection of relays passing data between
      clients. Anyone can run a client or relay. This particular 240char limited
      client is just one way to send data through Nostr.
    </p>
    <center>
      <img
        class="q-px-auto"
        style="width: 100%"
        src="https://i.imgur.com/NsnaiBP.png"
      />
      <br />
    </center>

    <p>
      Nostr uses public key cryptography. Posts are signed with your private key
      and people can follow your posts using your public key. Direct messages in
      this client are encrypted before being sent through nostr network.
    </p>
    <p>
      <a
        href="https://github.com/fiatjaf/nostr"
        target="_blank"
        style="color: #26a69a"
        >Learn more about the Nostr protocol</a
      >
    </p>
    <p>
      <a
        href="https://github.com/arcbtc/nostr"
        target="_blank"
        style="color: #26a69a"
        >https://github.com/arcbtc/nostr</a
      >
    </p>
    <center>
      <q-btn
        v-if="$store.getters.disabled"
        dense
        flat
        class="small-screen-only q-pa-lg"
        color="primary"
        size="md"
        label="Generate or Restore User Account"
        @click="dialogGenerate = true"
      ></q-btn>
    </center>

    <q-dialog v-model="dialogGenerate" position="top">
      <Generate />
    </q-dialog>

    <q-dialog v-if="$store.getters.disabled" v-model="warningPrompt" persistent>
      <q-card style="min-width: 350px">
        <q-card-section>
          <div class="text-h6">Warning!</div>
        </q-card-section>

        <q-card-section class="q-pt-none">
          <p>
            This is buggy and experimental software running for testing purposes
            ONLY, any data you put on here will be lost!<br />
          </p>
        </q-card-section>

        <q-card-actions align="right" class="text-primary">
          <q-btn flat label="Cancel" v-close-popup />
          <q-btn
            flat
            label="Proceed"
            v-close-popup
            @click="warningPrompt = false"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script>
import helpersMixin from '../utils/mixin'

export default {
  name: 'PageHelp',
  mixins: [helpersMixin],

  data() {
    return {
      dialogGenerate: false,
      warningPrompt: false
    }
  },
  created() {
    setTimeout(() => {
      this.warningPrompt = true
    }, 400)
  }
}
</script>
