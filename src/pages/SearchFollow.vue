<template>
  <q-page class='fit flex column no-wrap'>
    <TheSearchMenu />
  </q-page>
</template>

<script>
import TheSearchMenu from 'components/TheSearchMenu.vue'
import { createMetaMixin } from 'quasar'

const metaData = {
  // sets document title
  title: 'astral - search, follows',

  // meta tags
  meta: {
    description: { name: 'description', content: 'Nostr search and follows on astral' },
    keywords: { name: 'keywords', content: 'nostr decentralized social media' },
    equiv: { 'http-equiv': 'Content-Type', content: 'text/html; charset=UTF-8' },
  },
}

export default {
  name: 'SearchFollow',
  mixins: [createMetaMixin(metaData)],
  components: {
    TheSearchMenu
  }
}
</script>
