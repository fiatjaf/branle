<template>
  <router-view />
</template>

<script>
export default {
  name: 'App',
  created() {
    this.$q.dark.set(true)
  }
}
</script>
