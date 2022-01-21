<template>
  <div class="w-full ml-2">
    <q-banner class="py-5 bg-accent text-white cursor-auto">
      <div class="mb-2 text-bold text-center">Relay Recommendation</div>
      <div class="flex justify-evenly justify-center items-center ml-8 mt-4">
        <div class="font-mono text-xs">{{ url }}</div>
        <q-btn
          rounded
          color="secondary"
          class="py-0 ml-2"
          size="md"
          :icon="url in $store.state.relays ? 'radio_button_checked' : 'add'"
          :label="url in $store.state.relays ? 'Added' : 'Add Relay'"
          :disable="url in $store.state.relays"
          @click="addRelay"
        />
      </div>
    </q-banner>
  </div>
</template>

<script>
import helpersMixin from '../utils/mixin'

export default {
  name: 'Recommend',
  mixins: [helpersMixin],
  props: {
    url: {type: String, required: true}
  },
  methods: {
    addRelay() {
      this.$q
        .dialog({
          title: 'Add relay?',
          message: `Add ${this.url} to your list of relays?`,
          cancel: true
        })
        .onOk(() => {
          this.$store.commit('addRelay', this.url)
        })
    }
  }
}
</script>
