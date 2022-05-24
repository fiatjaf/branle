<template>
    <q-btn
      :class='buttonClass + (isFollowing ? "button-unfollow" : "button-follow")'
      :size='buttonSize'
      :disable="!$store.getters.canSignEventsAutomatically"
      unelevated
      :text-color='isFollowing ? "" : "secondary"'
      dense
      @click.stop="toggleFollowing"
    >
      <q-icon
        :name='isFollowing ? "person_remove" : "person_add"'
        :class='isFollowing ? "flip-horizontal" : ""'
      />
      <q-tooltip>
        {{isFollowing ? "unfollow" : "follow" }}
      </q-tooltip>
      <q-icon
        :name='isFollowing ? "person_remove" : "person_add"'
        :class='isFollowing ? "flip-horizontal" : ""'
      />
      <q-tooltip>
        {{isFollowing ? "unfollow" : "follow" }}
      </q-tooltip>
    </q-btn>
</template>

<script>
import { defineComponent } from 'vue'

export default defineComponent({
  name: 'BaseButtonFollow',
  props: {
    pubkey: {
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

  computed: {
    isFollowing() {
      return this.$store.state.following.includes(this.pubkey)
    }
  },

  methods: {
    toggleFollowing() {
      if (this.isFollowing) this.unfollow()
      else this.follow()
    },
    unfollow() {
      this.$store.commit('unfollow', this.pubkey)
    },

    follow() {
      this.$store.commit('follow', this.pubkey)
    }
  },
})
</script>

<style lang="scss" scoped>
.button-follow,
.button-unfollow {
  opacity: .6;
  transition: all .3s ease-in-out;
}
.button-follow:hover {
  opacity: 1;
}
.button-unfollow:hover {
  opacity: 1;
  color: $negative;
}
</style>
