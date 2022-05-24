<template>
    <q-btn
      v-if='buttonText'
      unelevated
      clickable
      class='button-clear'
      :class='"" + buttonClass'
      :size='buttonSize'
      dense
      icon="cancel"
      @click.stop='$emit("clear")'
    >
    </q-btn>
</template>
      <!-- @click='buttonText=""' -->

<script>
import { defineComponent } from 'vue'

export default defineComponent({
  name: 'BaseButtonClear',
  emits: ['clear'],
  props: {
    buttonText: {
      type: String,
      required: true
    },
    buttonClass: {
      type: String,
      required: false,
      default: ''
    },
    buttonSize: {
      type: String,
      required: false,
      default: 'sm'
    },
  },

  // methods: {
  //   clear() {
  //     console.log('clear text')
  //     this.$emit('clear')
  //   }
  // }
})
</script>

<style>
.button-clear {
  opacity: .6;
  transition: all .3s ease-in-out;
}
.button-clear:hover {
  opacity: 1;
}
</style>
