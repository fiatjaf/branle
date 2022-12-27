<template>
  <div class="w-full ml-2">
    <q-card class="cursor-pointer flex row justify-start items-center" flat>
        <q-btn
          rounded
          flat
          color="primary"
          size="md"
          :icon="url in $store.state.relays ? 'check' : 'add'"
          :label="url in $store.state.relays ? 'added' : 'add relay'"
          :disable="url in $store.state.relays"
          @click.stop="addRelay"
        />
        <div class="text-bold">{{ cleanUrl }}</div>
    </q-card>
  </div>
</template>

<script>
import * as DOMPurify from 'dompurify'

export default {
  name: 'BaseRelayCard',
  props: {
    url: {type: String, required: true}
  },
  computed: {
    cleanUrl() {
      return DOMPurify.sanitize(this.url)
    }
  },
  methods: {
    addRelay() {
      this.$q
        .dialog({
          title: 'Add relay?',
          message: `Add ${this.url} to your list of relays?`,
          cancel: {color: 'accent'},
          ok: {color: 'accent'}
        })
        .onOk(() => {
          this.$store.commit('addRelay', this.url)
        })
    }
  }
}
</script>

<style lang='css' scoped>
.q-card {
  border: 3px double var(--q-secondary);
  background: var(--q-background);
}
</style>
