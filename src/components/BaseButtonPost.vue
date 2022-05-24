<template>
    <q-btn
      unelevated
      clickable
      :size='buttonSize'
      class='button-post'
      dense
      @click='$emit("open")'
    >
      <div
        v-if='verbose'
        class='gt-sm'
        style='font-size: 1rem; font-weight: 700; letter-spacing: .05rem;'
      >
        <span v-if='!isOpen'>&nbsp;post&nbsp;</span>
        <span v-if='isOpen'>&nbsp;close&nbsp;</span>
      </div>
      <q-icon
        :name="isOpen ? 'close' : 'chat_bubble_outline'"
        :class='verbose ? "" : "flip-horizontal"'
        :color='isOpen ? "" : "primary"'
        :size='buttonSize'
      />
      </q-btn>
    <!-- <q-btn
      v-if='isOpen'
      icon="close"
      unelevated
      clickable
      :size='buttonSize'
      class='button-close'
      dense
      @click.stop='$emit("open")'
    >
      <div v-if='verbose' class='gt-sm'>close&nbsp;&nbsp;</div>
      </q-btn> -->
          <!-- <q-btn icon='chat_bubble_outline' flat size='sm' class='flip-horizontal'/> -->

</template>

<script>
import { defineComponent } from 'vue'

export default defineComponent({
  name: 'BaseButtonPost',
  emits: ['open'],
  props: {
    isOpen: {
      type: Boolean,
      required: true
    },
    // buttonColor: {
    //   type: String,
    //   required: false,
    //   default: ''
    // },
    // buttonClass: {
    //   type: String,
    //   required: false,
    //   default: ''
    // },
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
  //   info() {
  //     console.log(this.buttonText)
  //     navigator.clipboard.writeText(this.buttonText)
  //   }
  // }
})
</script>

<style>
.button-post,
.button-close {
  opacity: .6;
}
.button-post:hover,
.button-close:hover {
  opacity: 1;
}
</style>
