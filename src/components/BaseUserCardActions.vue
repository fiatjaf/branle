<template>
  <div
    class='flex row no-wrap'
    style='gap: .3rem;'
    :class='buttonGroupClass'
    >
    <BaseButtonCopy
      :button-text='npubKey'
      button-size='sm'
      text-color='secondary'
      tooltip-text='copy pubkey'
      @click.stop
    />
    <BaseButtonMessage
      v-if='(pubkey !== $store.state.keys.pub) && ($store.state.keys.pub)'
      :button-to="'/messages/' + npubKey"
      button-size='sm'
      text-color='primary'
      @click.stop
    />
    <BaseButtonFollow
      v-if='(pubkey !== $store.state.keys.pub) && ($store.state.keys.pub)'
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
import helpersMixin from '../utils/mixin'

export default defineComponent({
  name: 'BaseUserCardActions',
  mixins: [helpersMixin],
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

  computed: {
    npubKey() {
      return this.hexToBech32(this.pubkey, 'npub')
    }
  },
})
</script>
