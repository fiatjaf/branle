<template>
  <div>
    <div class="text-h5 text-bold q-pt-md q-pb-sm q-px-sm"><slot /></div>
    <q-separator v-if='separator' color='accent' size='1px'/>
  </div>
</template>

<script>
import { defineComponent } from 'vue'

export default defineComponent({
  name: 'BaseHeader',
  // emits: ['click'],
  props: {
    separator: {
      type: Boolean,
      default: true
    },
    // reachedEnd: {
    //   type: Boolean,
    //   default: false
    // },
    // label: {
    //   type: String,
    //   default: 'load more'
    // }
  },
})
</script>

