<template>
    <q-btn
      icon="reply"
      unelevated
      clickable
      @click='$emit("reply")'
      :class='"" + buttonClass'
      :size='buttonSize'
      class='button-reply'
      dense
      :label='verbose ? "reply" : ""'
      align="left"
    />
</template>

<script>
import { defineComponent } from 'vue'

export default defineComponent({
  name: 'BaseButtonReply',
  emits: ['reply'],
  props: {
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
    verbose: {
      type: Boolean,
      default: false,
    }
  },

  // methods: {
  //   reply(event) {
  //     this.$emit('reply', event)
  //   }
  // }
})
</script>

<style>
.button-reply {
  opacity: .7;
  transition: all .3s ease-in-out;
}
.button-reply:hover {
  opacity: 1;
}
</style>
