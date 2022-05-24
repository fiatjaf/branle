<template>
  <q-separator color='accent'/>
  <q-btn-group
  flat
  spread
  dense
  text-color="accent"
  class='baseshowmore'
  >
    <q-btn
      dense
      flat
      color="accent"
      class='text-weight-light'
      style='letter-spacing: .1rem;'
      @click.stop="showMore"
    >
    show more
    </q-btn>
  </q-btn-group>
  <q-separator color='accent'/>
</template>

<script>
import helpersMixin from '../utils/mixin'

export default {
  name: 'BaseShowMore',
  mixins: [helpersMixin],
  props: {
    root: {type: String, required: true},
    replies: {type: Array, required: false, default: null}
  },
  methods: {
    showMore() {
      if (this.replies && this.replies.length) this.toEvent(this.root, this.replies)
      else this.toEvent(this.root)
    }
  }
}
</script>

<style lang='scss' scoped>
.show-more-item {
  width: 100%;
  height: 1.5rem;
  border-top: 1px solid $accent;
  border-bottom: 1px solid $accent;
}
.show-more-middle-connector {
  width: 20px;
  height: 10px;
  position: absolute;
  left: calc(24px - 10px);
  top: calc(24px - 5px);
  background: inherit;
  z-index: 1;
  border-top: 2px solid $accent;
  border-bottom: 2px solid $accent;
}
.show-more-bottom-connector {
  width: 2px;
  height: calc((100% - 10px) / 2);
  position: absolute;
  left: calc(24px - 1px);
  top: 0;
  background: $accent;
  z-index: 0;
}
.show-more-top-connector {
  width: 2px;
  height: calc((100% - 10px) / 2);
  position: absolute;
  left: calc(24px - 1px);
  bottom: 0;
  background: $accent;
  z-index: 0;
}
</style>
