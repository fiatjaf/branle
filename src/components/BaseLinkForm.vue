<template>
  <q-form @submit='addLink({ url, name })' class='no-padding flex row items-center no-wrap justify-between'>
    <q-input v-model='url' type='url' label='url' dense outlined autofocus color='accent' class='no-padding col-9'/>
    <q-input v-model='name' label='url name' :disable='url.length === 0' outlined dense color='accent' class='no-padding col-2'/>
    <q-btn icon="add" type="submit" :disable='url.length === 0' outline round color="accent" size='sm' class='no-padding'/>
  </q-form>
</template>

<script>

export default {
  name: 'BaseLinkForm',
  emits: ['link-added', 'link-removed'],
  props: {
    links: {type: Array, required: true}
  },
  data() {
    return {
      url: '',
      name: '',
    }
  },
  methods: {
    linkName(link) {
      if (link.name) return `${link.name}: `
      return ''
    },
    addLink(link) {
      if (link.name.length === 0) delete link.name
      this.$emit('link-added', link)
      this.url = ''
      this.name = ''
    },
    removeLink(index) {
      this.$emit('link-removed', index)
    }
  }
}
</script>

<style lang='scss'>

</style>
