<template>
  <q-item
    clickable
    unelevated
    outlined
    class='no-padding flex row justify-start items-center'
    :class='(alignRight ? "text-right reverse" : "text-left") +
      (headerMode ? " header-mode" : "") +
      ((!hasTouch && !headerMode && actionButtons) ? " hidden-action-buttons" : "")'
    @click.stop="toProfile(pubkey)"
    style='max-width: 100%; gap: .5rem'
  >
    <div>
      <BaseUserAvatar
        :pubkey="pubkey"
        :align-right='alignRight'
        :size='headerMode ? "10rem" : "lg"'
        :show-verified='!headerMode'
        :class='headerMode ? "self-center" : ""'
      />
    </div>
    <q-item-section
      :class='(headerMode ? "self-start" : "") + largeMode'
      :style='!headerMode ? "white-space: nowrap; overflow: auto;" : ""'
    >
      <BaseUserName
        :pubkey="pubkey"
        :header-mode='headerMode'
        :show-verified='headerMode'
      />
      <div caption class='text-secondary pubkey'>{{ shorten(pubkey) }}</div>
      <BaseMarkdown v-if='headerMode' >
        {{ $store.getters.profileDescription(pubkey) }}
      </BaseMarkdown>
      <BaseUserCardActions
        v-if="actionButtons"
        :pubkey='pubkey'
        class='action-buttons'
      />
    </q-item-section>
  </q-item>
</template>

<script>
import { defineComponent } from 'vue'
import { useQuasar } from 'quasar'
import helpersMixin from '../utils/mixin'
import BaseUserCardActions from 'components/BaseUserCardActions.vue'
import BaseMarkdown from 'components/BaseMarkdown.vue'

export default defineComponent({
  name: 'BaseUserCard',
  components: {
    BaseUserCardActions,
    BaseMarkdown,
  },
  mixins: [helpersMixin],
  props: {
    pubkey: {
      type: String,
      required: true
    },
    alignRight: {
      type: Boolean,
      required: false,
      default: false
    },
    largeMode: {
      type: String,
      required: false,
      default: ''
    },
    headerMode: {
      type: Boolean,
      required: false,
      default: false
    },
    actionButtons: {
      type: Boolean,
      required: false,
      default: true
    },
  },

  setup() {
    const $q = useQuasar()
    let hasTouch = $q?.platform.has.touch || false
    return {hasTouch}
  },
})
</script>

<style lang="scss" scoped>
.hidden-action-buttons .action-buttons {
  display: none;
  visibility: hidden;
}
.hidden-action-buttons:hover .action-buttons {
  display: unset;
  visibility: visible;
}
.hidden-action-buttons .pubkey {
  display: unset;
  visibility: visible;
}
.hidden-action-buttons:hover .pubkey {
  display: none;
  visibility: hidden;
}
.header-mode {
  flex-direction: column;
}
@media screen and (min-width: 400px) {
  .header-mode {
    flex-direction: row;
    align-items: center;
  }
}
</style>
