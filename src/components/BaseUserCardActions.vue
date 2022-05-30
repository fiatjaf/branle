<template>
  <div
    class='flex row no-wrap'
    style='gap: .3rem;'
    :class='buttonGroupClass'
    >
    <BaseButtonCopy
      :button-text='pubkey'
      button-size='sm'
      text-color='secondary'
      tooltip-text='copy pubkey'
      @click.stop
    />
    <BaseButtonMessage
      v-if='pubkey !== $store.state.keys.pub'
      :button-to="'/messages/' + pubkey"
      button-size='sm'
      text-color='primary'
      @click.stop
    />
    <BaseButtonFollow
      v-if='pubkey !== $store.state.keys.pub'
      :pubkey='pubkey'
      button-size='sm'
      @click.stop
    />
  </div>
</template>

<script>
import { defineComponent } from 'vue'
import BaseButtonMessage from 'components/BaseButtonMessage.vue'
import BaseButtonFollow from 'components/BaseButtonFollow.vue'
import BaseButtonCopy from 'components/BaseButtonCopy.vue'

export default defineComponent({
  name: 'BaseUserCardActions',
  props: {
    pubkey: {
      type: String,
      required: true
    },
    buttonGroupClass: {
      type: String,
      required: false,
      default: ''
    },
    // buttonSize: {
    //   type: String,
    //   required: false,
    //   default: 'sm'
    // },
  },
  components: {
    BaseButtonMessage,
    BaseButtonFollow,
    BaseButtonCopy,
  },

})
</script>
