<template>
  <q-separator color='accent'/>
  <q-btn-group
  flat
  spread
  dense
  text-color="accent"
  >
    <q-btn
      dense
      flat
      color="accent"
      class='text-weight-light'
      style='letter-spacing: .1rem;'
      @click.stop="showMore"
      :label='replyCount ? replyCount + " replies" : "show more"'
    >
    <!-- show more -->
    </q-btn>
  </q-btn-group>
  <q-separator v-if='!replyCount' color='accent'/>
</template>

<script>
import helpersMixin from '../utils/mixin'

export default {
  name: 'BaseButtonShowMore',
  mixins: [helpersMixin],
  props: {
    root: {type: String, required: true},
    replyCount: {type: Number, default: 0},
    // replies: {type: Boolean, default: false}
    // replies: {type: Array, required: false, default: null}
  },
  methods: {
    showMore() {
      this.toEvent(this.root)
    }
  }
}
</script>

<style lang='scss' scoped>
</style>
