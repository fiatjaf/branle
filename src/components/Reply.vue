<template>
  <q-card class="my-card q-mt-md" flat style="border: none; width: 90%">
    <q-card-section class="no-shadow" vertical>
      <q-card-section class="no-shadow" horizontal>
        <q-card-section class="no-shadow q-pb-none">
          <q-avatar class="no-shadow">
            <img :src="$store.getters.avatar(event.pubkey)" />
          </q-avatar>
        </q-card-section>

        <q-separator vertical style="display: none" />

        <q-card-section class="col no-shadow q-pb-none">
          <q-item-label
            >{{ $store.getters.displayName(event.pubkey) }}
            <small style="color: grey">{{ niceDate(event.created_at) }}</small>
          </q-item-label>
          {{ event.content }}
          <div></div>
        </q-card-section>
      </q-card-section>

      <q-card-section class="no-shadow q-pa-none q-pl-xl">
        <div class="row" style="width: 100%">
          <q-form style="width: 100%" class="q-gutter-md" @submit="sendReply"
            ><q-tooltip> Coming soon </q-tooltip>
            <q-input
              disable
              v-model="text"
              dense
              style="font-size: 20px"
              autogrow
              maxlength="280"
            >
            </q-input>

            <div class="float-right">
              <q-btn
                disable
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
                disable
                label="Reply"
                rounded
                unelevated
                type="submit"
                class="float-right"
                color="primary"
              />
            </div>
          </q-form>
        </div>
      </q-card-section>
    </q-card-section>
  </q-card>
</template>

<script>
import helpersMixin from '../utils/mixin'

export default {
  mixins: [helpersMixin],

  props: ['event'],
  data() {
    return {
      text: ''
    }
  },
  methods: {
    sendReply() {
      this.$store.dispatch('sendPost', {
        message: this.text,
        tags: [['e', this.event.id]]
      })
      this.text = ''
    }
  }
}
</script>
