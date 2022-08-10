<template>
  <q-btn
    unelevated
    clickable
    :size='buttonSize'
    class='button-set-user'
    dense
  >
    <div
      v-if='verbose'
      class='gt-sm'
      style='font-size: 1rem; font-weight: 700; letter-spacing: .05rem;'
    >
      <span>&nbsp;{{ $t('setUser') }}&nbsp;</span>
    </div>
    <q-icon
      name='login'
      color='primary'
      :size='buttonSize'
    />
  </q-btn>
</template>

<script>
import { defineComponent } from 'vue'

export default defineComponent({
  name: 'BaseButtonSetUser',
  props: {
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
.button-set-user {
  opacity: .6;
}
.button-set-user:hover {
  opacity: 1;
}
</style>
