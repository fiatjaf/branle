<template>
  <q-page class="flex column justify-center items-center">
    <img
      alt="astral logo"
      src="~assets/astral-logo.svg"
      style="width: 200px; height: 200px;"
    >
    <TheKeyInitializationDialog v-if='!$store.state.keys.pub' />
  </q-page>
</template>

<script>
import { defineComponent } from 'vue'
import TheKeyInitializationDialog from 'components/TheKeyInitializationDialog.vue'

export default defineComponent({
  name: 'IndexPage',
  components: {
    TheKeyInitializationDialog,
  },
})
</script>

<style lang='css' scoped>
/*.q-page {
  background-image: url("~assets/astral-logo.svg");
  background-position: center;
  background-repeat: no-repeat;
  background-size: contain;
}*/
</style>
