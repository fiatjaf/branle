<template>
  <div class='base-select'>
    <!-- <div class="flex justify-between base-select" :style='(allowSelection ? "cursor: pointer; opacity: 1;" : "cursor: not-allowed; opacity: .5;")' @click.stop='toggle'>
      <span class='q-pl-sm' ><slot /></span>
      <q-icon :name='selecting ? "arrow_drop_up" : "arrow_drop_down"' size='xs'/>
    </div> -->
    <div class='base-select-list' style="max-height: 15rem; overflow: auto; width: 100%; cursor: pointer;">
      <ul class="" style='margin-block-start: 0; margin-block-end: 0; padding-inline-start: 0;'>
        <slot name="selected" />
      </ul>
    </div>
    <div class='base-select-list' style="max-height: 15rem; overflow: auto; width: 100%; cursor: pointer;">
      <ul class="" style='margin-block-start: 0; margin-block-end: 0; padding-inline-start: 0;'>
        <slot name="options" />
      </ul>
    </div>
  </div>
</template>

<script>
import { defineComponent } from 'vue'

export default defineComponent({
  name: 'BaseSelectMultiple',
  emits: ['add', 'remove'],
  props: {
    // options: {
    //   type: Array,
    //   required: true
    // },
    // selected: {
    //   type: Array,
    //   required: true
    // }
    // allowSelection: {
    //   type: Boolean,
    //   default: true
    // },
    // selecting: {
    //   type: Boolean,
    //   default: false
    // }

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
    add(item) {
      this.$emit('add', item)
    },
    remove(item) {
      this.$emit('remove', item)
    },
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
