<template>
  <q-form @submit='addLink({ url, name })' class='no-padding flex row items-center no-wrap justify-between'>
    <q-input v-model='url' type='url' label='url' dense outlined autofocus color='accent' class='no-padding col-9'/>
    <q-input v-model='name' label='url name' :disable='url.length === 0' outlined dense color='accent' class='no-padding col-2'/>
    <q-btn icon="add" type="submit" :disable='!validUrl' outline round color="accent" size='sm' class='no-padding' :class='validUrl ? "pulse-button" : ""'/>
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
      validUrl: false,
    }
  },
  watch: {
    async url(curr, prev) {
      if (!curr) this.validUrl = false
      else {
        try {
          this.validUrl = Boolean(new URL(curr))
        } catch (_) {
          this.validUrl = false
        }
      }
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
<style lang='scss' scoped>
.pulse-button {
	box-shadow: 0 0 0 0 var(--q-accent);
	transform: scale(1);
	animation: pulse 1s infinite;
}
@keyframes pulse {
	0% {
		transform: scale(0.95);
		box-shadow: 0 0 0 0 var(--q-accent);
	}

	70% {
		transform: scale(1);
		box-shadow: 0 0 0 5px var(--q-accent);
	}

	100% {
		transform: scale(0.95);
		box-shadow: 0 0 0 0 var(--q-accent);
	}
}
</style>

