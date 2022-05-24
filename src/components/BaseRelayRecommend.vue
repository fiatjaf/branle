<template>
  <div class="flex column q-gutter-md">
      <div class="" caption>added relay:</div>
      <BaseRelayCard :url='url' />
  </div>
</template>

<script>
import helpersMixin from '../utils/mixin'
import BaseRelayCard from 'components/BaseRelayCard'

export default {
  name: 'BaseRelayRecommend',
  mixins: [helpersMixin],
  components: {
    BaseRelayCard,
  },
  props: {
    url: {type: String, required: true}
  },
}
</script>
