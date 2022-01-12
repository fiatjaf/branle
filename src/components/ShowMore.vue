<template>
  <q-item class="py-0">
    <q-item-section><div class="dashed-line"></div></q-item-section>
    <q-item-section>
      <q-item-label class="text-center">
        <span class="underline cursor-pointer" @click="toEvent(root)"
          >Show more</span
        >
      </q-item-label></q-item-section
    >
    <q-item-section></q-item-section>
  </q-item>
</template>

<script>
import helpersMixin from '../utils/mixin'

export default {
  name: 'ShowMore',
  mixins: [helpersMixin],
  props: {
    root: {type: String, required: true}
  }
}
</script>

<style>
.dashed-line {
  border-right: 2px dashed;
  @apply border-gray-400;
  height: 100%;
  width: 21px;
}
</style>
