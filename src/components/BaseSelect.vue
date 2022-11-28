<template>
  <div style='cursor: pointer; padding-left: .2rem;' class='relative-position'>
    <div class="flex justify-between base-select" :style='(allowSelection ? "cursor: pointer; opacity: 1;" : "cursor: not-allowed; opacity: .5;")' @click.stop='toggle'>
      <span class='q-pl-sm' ><slot /></span>
      <q-icon :name='selecting ? "arrow_drop_up" : "arrow_drop_down"' size='xs'/>
    </div>
    <div v-if='selecting && allowSelection' class='base-select-list' style="position: absolute; top: 1.3rem; z-index: 1; max-height: 15rem; overflow-y: auto; width: 100%;">
      <ul class="" style='display: block; margin-block-start: .5rem; margin-block-end: .5rem; padding-inline-start: .5rem;'>
        <slot name="list-items" />
      </ul>
    </div>
  </div>
</template>

<script>
import { defineComponent } from 'vue'

export default defineComponent({
  name: 'BaseSelect',
  emits: ['toggle'],
  props: {
    allowSelection: {
      type: Boolean,
      default: true
    },
    selecting: {
      type: Boolean,
      default: false
    }

    // reachedEnd: {
    //   type: Boolean,
    //   default: false
    // },
    // label: {
    //   type: String,
    //   default: 'load more'
    // }
  },

  // data() {
  //   return {
  //     selecting: false,
  //   }
  // },
  methods: {
    toggle() {
      if (this.allowSelection) this.$emit('toggle')
    }
  }
})
</script>


<style lang='css' scoped>
.base-select {
   background: rgba(0, 0, 0, 0.05);
}
.body--dark .base-select {
   background: rgba(255, 255, 255, 0.08);
}
.base-select-list {
  background: var(--q-background);
}
.base-select-list li:active,
.base-select-list li:hover {
  background: rgba(0, 0, 0, 0.05);
}
li:active,
li:hover {
  background: rgba(0, 0, 0, 0.05);
}
.body--dark .base-select-list li:active,
.body--dark .base-select-list li:hover {
  background: rgba(255, 255, 255, 0.08);
}
</style>

<style lang='css'>
.base-select-list ul {
  list-style: none
}
.base-select-list ul li:active,
.base-select-list ul li:hover {
  background: rgba(0, 0, 0, 0.05);
}
.body--dark .base-select-list ul li:active,
.body--dark .base-select-list ul li:hover {
  background: rgba(255, 255, 255, 0.08);
}
</style>
