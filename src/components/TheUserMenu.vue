<template>
  <q-list
    :class='compactMode ? "flex row no-wrap items-center compact-menu" : "text-right"'
    :dense='compactMode'
  >
    <q-item
      v-if='$store.state.keys.pub'
      class='col no-padding flex items-center'
      :class="compactMode ? 'justify-center' : 'justify-end'"
      clickable
      @click='toProfile($store.state.keys.pub)'
    >
      <BaseUserCard
        v-if='!compactMode'
        :pubkey='$store.state.keys.pub'
        :align-right='true'
        class='text-accent q-mr-sm gt-sm'
      />
      <BaseUserAvatar
        v-if='!compactMode'
        :pubkey="$store.state.keys.pub"
        :align-right='true'
        :show-verified='true'
        size='lg'
        class='text-accent q-mr-sm lt-md'
      />
      <BaseUserAvatar
        v-if='$store.state.keys.pub && compactMode'
        :pubkey="$store.state.keys.pub"
        :align-right='true'
        :show-verified='true'
        size='1.5rem'
      />
    </q-item>
    <q-separator v-if='!compactMode' color='accent' spaced/>
    <q-item
      v-for='item in filteredUserMenuItems'
      clickable
      class='menu-item'
      :dense='compactMode'
      :active="$route.name === item.title"
      active-class=''
      :to="item.to"
      :key='item.title'
      :class="($route.path.split('/')[1] === item.match ? 'menu-item-active text-accent ' : '') +
        (compactMode ? 'no-margin no-padding col' : 'self-end q-px-none')"
    >
      <q-item-section v-if='!compactMode' class='gt-sm text-uppercase'>
        <div>
          {{ $t(item.title) }}
        </div>
      </q-item-section>

      <q-item-section
        v-if="item.icon && !compactMode"
        avatar
        class="relative-position no-padding"
      >
        <q-icon outline :name="item.icon"/>
        <q-badge
          v-if="item.badge && $store[item.badge.split('.')[0]][item.badge.split('.')[1]]"
          color="secondary"
          floating
          class='q-mr-md text-bold'
          outline
        >
          {{ $store[item.badge.split('.')[0]][item.badge.split('.')[1]] }}
        </q-badge>
      </q-item-section>

      <div
        v-if="item.icon && compactMode"
        avatar
        class="q-mx-auto no-padding relative-position"
      >
        <q-icon :name="item.icon" size='sm'/>
        <q-badge
          v-if="item.badge && $store[item.badge.split('.')[0]][item.badge.split('.')[1]]"
          color="secondary"
          floating
          class='q-ml-lg'
          rounded
        />
      </div>
    </q-item>
    <q-separator v-if='!compactMode' color='accent' spaced/>
      <div
        color="primary"
        class='flex '
        :class='compactMode ? "col justify-center" : "q-my-md justify-end"'
      >
        <BaseButtonPost
          v-if='$store.state.keys.pub'
          :is-open='post'
          :verbose='true'
          @open='post = !post'
          :outline='!compactMode'
          :flat='compactMode'
          color='primary'
          :size='compactMode ? "sm" : "lg"'
          :class='compactMode ? "" : "q-px-sm"'
        />
        <BaseButtonSetUser
          v-if='!$store.state.keys.pub'
          :to="{ name: 'settings' }"
          :verbose='true'
          :outline='!compactMode'
          :flat='compactMode'
          color='primary'
          :size='compactMode ? "sm" : "lg"'
          :class='compactMode ? "" : "q-px-sm"'
        />
      </div>
    <q-dialog
      v-model='post'
      seamless
      position='bottom'
      transition-show='slide-up'
      transition-hide='slide-down'
    >
      <q-card unelevated class='flex column no-wrap post-entry relative-position'
      >
        <div class='absolute-top-right'>
          <q-btn class='z-top' icon="close" flat dense v-close-popup/>
        </div>
        <BasePostEntry class='q-pa-md' @sent='post = false'/>
        <div class='compact-user-menu-space'/>
      </q-card>
    </q-dialog>
    <!-- <input type='color' /> -->
  </q-list>
</template>

<script>
import { defineComponent } from 'vue'
import helpersMixin from '../utils/mixin'
import BaseUserCard from 'components/BaseUserCard.vue'
import BaseButtonPost from 'components/BaseButtonPost.vue'
import BaseButtonSetUser from 'components/BaseButtonSetUser.vue'

export default defineComponent({
  name: 'TheUserMenu',
  mixins: [helpersMixin],
  props: {
    compactMode: {
      type: Boolean,
      default: false,
    },
  },

  data() {
    return {
      post: false,
      position: 'bottom',
      userMenuItems: [
        {
          title: 'feed',
          icon: 'newspaper',
          to: '/feed',
          match: 'feed',
        },
        {
          title: 'notifications',
          badge: 'state.unreadNotifications',
          icon: 'notifications',
          to: '/notifications',
          match: 'notifications',
        },
        {
          title: 'messages',
          badge: 'getters.unreadChats',
          icon: 'mail_lock',
          to: '/messages/inbox',
          match: 'messages',
        },
        // {
        //   title: 'lists',
        //   // caption: 'forum.quasar.dev',
        //   icon: 'list',
        //   to: '/lists',
        // },
        // {
        //   title: 'profile',
        //   icon: 'account_circle',
        //   to: '/' + this.$store.state.keys.pub,
        //   match: this.$store.state.keys.pub,
        // },
        {
          title: 'settings',
          icon: 'settings',
          to: '/settings',
          match: 'settings',
        },
        {
          title: 'follow',
          icon: 'search',
          to: '/follow',
          match: 'follow',
          compactMenuOnly: true,
        },
      ],
    }
  },

  components: {
    BaseUserCard,
    BaseButtonPost,
    BaseButtonSetUser,
  },

  computed: {
    filteredUserMenuItems() {
      if (!this.$store.state.keys.pub) return this.userMenuItems.filter(item => item.title === 'feed')
      if (!this.compactMode) return this.userMenuItems.filter(item => !item.compactMenuOnly)
      return this.userMenuItems
    }
  },
})
</script>

<style lang='scss' scoped>
.q-item {
  transition: all .2s ease-in-out
}
.menu-item {
 letter-spacing: .1rem;
 opacity: .7;
}
.menu-item:hover {
  opacity: 1;
  font-weight: bold;
}
.menu-item-active {
  color: $accent;
  opacity: 1;
  font-weight: bold;
}
.q-dialog .post-entry {
  width: 600px;
  overflow: auto;
}
.compact-user-menu-space {
  height: 2rem;
}

@media screen and (min-width: 700px) {
  .compact-user-menu-space {
    display: none;
  }
}
</style>
