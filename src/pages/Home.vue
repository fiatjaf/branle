<template>
  <q-page>
    <Publish v-if="!$store.getters.disabled" />
    <Post
      v-for="event in $store.state.events.kind1"
      :key="event.id"
      :event="event"
    />
  </q-page>
</template>

<script>
import helpersMixin from '../utils/mixin'

export default {
  name: 'Home',
  mixins: [helpersMixin],

  data() {
    return {}
  }
}
</script>
