<template>
  <q-toolbar>
        <q-btn dense flat round icon='menu' @click='toggleLeftDrawer' />
        <q-toolbar-title class='flex justify-center'>astral</q-toolbar-title>
        <q-btn dense flat round icon='groups' @click='toggleRightDrawer' />
      </q-toolbar>
</template>

<script>
import { defineComponent, ref } from 'vue'

export default defineComponent({
  name: 'TheToolbar',

  setup() {
    const leftDrawerOpen = ref(false)
    const rightDrawerOpen = ref(false)

    return {
      leftDrawerOpen,
      rightDrawerOpen,
      toggleLeftDrawer() {
        leftDrawerOpen.value = !leftDrawerOpen.value
      },
      toggleRightDrawer() {
        rightDrawerOpen.value = !rightDrawerOpen.value
      },
    }
  }
})
</script>
