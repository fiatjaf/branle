<template>
  <q-page class='fit flex column no-wrap'>
    <TheSearchMenu />
  </q-page>
</template>

<script>
import helpersMixin from '../utils/mixin'
import TheSearchMenu from 'components/TheSearchMenu.vue'

export default {
  name: 'SearchFollow',
  mixins: [helpersMixin],
  components: {
    TheSearchMenu
  }
}
</script>
