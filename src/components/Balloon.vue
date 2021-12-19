<template>
  <q-chat-message
    :class="{invisible}"
    :text="
      event.combination
        ? event.combination.map(event => event.plaintext)
        : [event.plaintext]
    "
    :name="$store.getters.displayName(event.pubkey)"
    :avatar="$store.getters.avatar(event.pubkey)"
    :sent="event.pubkey === $store.state.keys.pub"
    :stamp="niceDate(new Date(event.created_at))"
    :bg-color="event.pubkey === $store.state.keys.pub ? 'primary' : 'tertiary'"
  />
</template>

<script>
import helpersMixin from '../utils/mixin'

export default {
  mixins: [helpersMixin],
  props: {event: {type: Object, required: true}},
  data() {
    return {
      invisible: true
    }
  },
  mounted() {
    setTimeout(() => {
      this.invisible = false
    }, 150)
  }
}
</script>
