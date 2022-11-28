<template>
  <div>
    <!-- <q-separator color='accent'/> -->
    <q-btn-group
    spread
    dense
    outline
    rounded
    text-color="accent"
    >
      <q-btn
        dense
        :loading='loadingMore'
        outline
        rounded
        color="accent"
        class='text-weight-light q-ma-sm'
        style='letter-spacing: .1rem;'
        :label='reachedEnd ? "reached end" : label'
        :disable='reachedEnd'
        @click="$emit('click')"
      >
        <template #loading>
          <div class='row justify-center'>
            <q-spinner-orbit color="accent" size='sm' />
          </div>
        </template>
      </q-btn>
    </q-btn-group>
    <!-- <q-separator color='accent'/> -->
  </div>
</template>

<script>
import { defineComponent } from 'vue'

export default defineComponent({
  name: 'BaseButtonLoadMore',
  emits: ['click'],
  props: {
    loadingMore: {
      type: Boolean,
      required: true
    },
    reachedEnd: {
      type: Boolean,
      default: false
    },
    label: {
      type: String,
      default: 'load more'
    }
  },
})
</script>

<style lang='css' scoped>
.q-btn-group {
  background: var(--q-background);
}
</style>
