<template>
  <q-layout>
    <TheKeyInitializationDialog v-if='!$store.state.keys.pub'/>
    <div id='layout-container' :ripple='false'>
      <div id='left-drawer' class='flex justify-end'>
        <TheUserMenu :item-mode='$q.screen.width < 1023' :show-compact-mode-items='$q.screen.width < 700' :posting='postEntryOpen' @toggle-post-entry='togglePostEntry'/>
      </div>

      <div id='middle-page'>
        <q-page-container ref='pageContainer'>
          <router-view v-slot="{ Component }">
            <keep-alive  >
              <component :is="Component" :key='$route.path' @scroll-to-rect='scrollToRect' @reply-event='setReplyEvent'/>
            </keep-alive>
          </router-view>
        </q-page-container>
      <div v-if='postEntryOpen || messageMode' id='post-entry' unelevated class='gt-xs flex column align-self'>
        <q-separator color='accent'/>
          <q-btn v-if='!messageMode' icon="close" flat @click='togglePostEntry' class='self-end'/>
        <BasePostEntry
          :message-mode='messageMode'
          :event='replyEvent'
          @clear-event='replyEvent=null'
          @sent='togglePostEntry'
          class='q-px-md'
          :class='messageMode ? "q-pt-sm" : ""'
        />
      </div>
        <div id='bottom-post-entry-placeholder' />
        <div id='bottom-menu-placeholder' />
      </div>

      <div id='right-drawer' class='flex justify-start'>
        <TheSearchMenu/>
      </div>
    </div>
    <q-page-sticky id='bottom-drawer' position="bottom" class='z-top xs'>
      <q-separator color='accent'/>
      <div  v-if='postEntryOpen || messageMode' id='bottom-post-entry' unelevated class='flex column align-self'>
          <q-btn v-if='!messageMode' icon="close" flat @click='togglePostEntry' class='self-end'/>
        <BasePostEntry
          :message-mode='messageMode'
          :event='replyEvent'
          @clear-event='replyEvent=null'
          @sent='togglePostEntry'
          @resized='resizePostEntryPlaceholder'
          :auto-focus='false'
          class='q-px-md'
        />
      </div>
      <TheUserMenu id='bottom-menu' :compact-mode='true' :posting='postEntryOpen' @toggle-post-entry='togglePostEntry'/>
    </q-page-sticky>
    <q-page-sticky position="top-right" :offset="fabPos" id='navagation-buttons'>
      <q-fab
        direction="left"
        color="accent"
        class='no-margin no-padding z-top'
        :model-value='true'
        persistent
        flat
        padding='xs'
        :disable="draggingFab"
        v-touch-pan.prevent.mouse="moveFab"
      >
        <template #tooltip>
          <q-tooltip>
            click to collapse/expand or drag to move
          </q-tooltip>
        </template>
        <template #icon>
          <q-icon name='drag_indicator'/>
        </template>
        <template #active-icon>
          <q-icon name='drag_indicator'/>
        </template>
        <q-btn
          @click.stop="forward"
          color="primary"
          unelevated
          round
          outline
          icon="keyboard_arrow_right"
          :disable="draggingFab"
        >
          <q-tooltip>forward</q-tooltip>
        </q-btn>
        <q-btn
          @click.stop="scrollToTop"
          color="primary"
          unelevated
          round
          outline
          icon="keyboard_double_arrow_up"
          :disable='draggingFab || $route.name === "inbox" || $route.name === "messages"'
        >
          <q-tooltip>scroll to top</q-tooltip>
        </q-btn>
        <q-btn
          @click.stop="back"
          color="primary"
          unelevated
          round
          outline
          icon="keyboard_arrow_left"
          :disable="draggingFab"
        >
          <q-tooltip>back</q-tooltip>
        </q-btn>
      </q-fab>
    </q-page-sticky>
  </q-layout>
</template>

<script>
import { defineComponent} from 'vue'
import { scroll, useQuasar } from 'quasar'
const { getVerticalScrollPosition, setVerticalScrollPosition} = scroll
import { activateSub, deactivateSub, destroyStreams } from '../query'
import TheKeyInitializationDialog from 'components/TheKeyInitializationDialog.vue'
import TheUserMenu from 'components/TheUserMenu.vue'
import TheSearchMenu from 'components/TheSearchMenu.vue'

export default defineComponent({
  name: 'MainLayout',
  components: {
    TheKeyInitializationDialog,
    TheUserMenu,
    TheSearchMenu,
  },

  setup () {
    const $q = useQuasar()
    return $q
  },

  data() {
    return {
      middlePagePos: {},
      fabPos: [0, 10],
      draggingFab: false,
      broadcastChannel: new BroadcastChannel('astral'),
      activeWindow: false,
      timeout: null,
      hasLaunched: false,
      postEntryOpen: false,
      replyEvent: null,
    }
  },

  computed: {
    scrollingContainer() {
      if (this.$q.screen.width < 600) return window
      return this.$refs.pageContainer?.$el
    },
    messageMode() {
      if (this.$route.name === 'messages') {
        if (this.replyEvent) return 'reply'
        else return 'message'
      } else return null
    }
  },

  mounted() {
    // coordinate closing/opening of db if multiple astral windows
    this.broadcastChannel.onmessage = (event) => {
      let {type} = event.data

      if (type === 'active' && this.activeWindow) this.deactivateWindow()
      else if (type === 'closing' && this.timeout) clearTimeout(this.timeout)
      else if (type === 'done' && this.activeWindow) this.launch()
    }
    this.activateWindow()
    document.addEventListener('visibilitychange', this.activateWindow())
    window.onfocus = this.activateWindow

    // setup scrolling
    document.querySelector('#left-drawer').addEventListener('wheel', this.redirectScroll)
    this.$router.beforeEach((to, from) => { this.preserveScrollPos(to, from) })
    this.$router.afterEach((to, from) => { this.restoreScrollPos(to, from) })
    let pageRect = this.$refs.pageContainer?.$el.getBoundingClientRect()
    if (pageRect) this.fabPos[0] = pageRect.right - pageRect.width

    // destroy streams before unloading window
    window.onbeforeunload = async () => {
      await destroyStreams()
    }
  },

  beforeUnmount() {
    document.querySelector('#left-drawer').removeEventListener('wheel', this.redirectScroll)
  },

  methods: {
    redirectScroll(event) {
      let pos = getVerticalScrollPosition(this.scrollingContainer)
      setVerticalScrollPosition(this.scrollingContainer, pos + event.deltaY)
    },

    preserveScrollPos(to, from) {
      this.middlePagePos[from.fullPath] = getVerticalScrollPosition(this.scrollingContainer)
    },

    restoreScrollPos(to, from) {
      if (this.middlePagePos[to.fullPath]) setVerticalScrollPosition(this.scrollingContainer, this.middlePagePos[to.fullPath], 500)
      else this.scrollToTop()
    },

    scrollToTop() {
      setVerticalScrollPosition(this.scrollingContainer, 0, 500)
    },

    back() {
      this.$router.go(-1)
    },

    forward() {
      this.$router.go(1)
    },

    moveFab(ev) {
      this.draggingFab = ev.isFirst !== true && ev.isFinal !== true

      this.fabPos = [
        this.fabPos[0] - ev.delta.x,
        this.fabPos[1] + ev.delta.y
      ]
    },

    scrollToRect(rect) {
      let offset = Math.max(rect.top, 0)
      setVerticalScrollPosition(this.scrollingContainer, offset, 500)
    },

    async launch() {
      // await dbInit()
      this.timeout = null
      if (this.hasLaunched) {
        activateSub()
      }
      if (this.$store.state.keys.pub) {
        this.$store.dispatch('launch')
      } else {
        this.$store.dispatch('launchWithoutKey')
      }
      this.hasLaunched = true
    },

    async activateWindow() {
      if (document.hidden || this.activeWindow) return
      this.activeWindow = true
      this.broadcastChannel.postMessage({ type: 'active' })
      if (!this.timeout) this.timeout = setTimeout(this.launch, 100)
    },

    async deactivateWindow() {
      this.broadcastChannel.postMessage({ type: 'closing' })
      this.activeWindow = false
      // deactivateSub will post 'done' message to broadcastChannel
      deactivateSub()
    },

    togglePostEntry() {
      if (this.messageMode) {
        this.replyEvent = null
      } else this.postEntryOpen = !this.postEntryOpen
    },

    setReplyEvent(event) {
      this.replyEvent = event
    },

    resizePostEntryPlaceholder() {
      setTimeout(() => {
        document.querySelector('#bottom-post-entry-placeholder').style.minHeight = `${document.querySelector('#bottom-post-entry').clientHeight}px`
      }, 1000)
    },
  },
})

</script>

<style lang='scss'>
body {
  display: block;
  height: 100vh;
  overflow: auto;
}
#layout-container {
  display: flex;
  justify-content: center;
  width: 100%;
  position: relative;
  flex-wrap: nowrap;
}
#left-drawer, #right-drawer {
  display: none;
  transition: all 1s linear;
  margin: .5rem;
}
#left-drawer {
}
#middle-page {
  width: 700px;
  max-width: 100%;
  height: auto;
  background: $dark;
  padding-bottom: 2rem;
  border-right: 2px solid $accent;
  border-left: 2px solid $accent;
  display: flex;
  flex-direction: column;
  padding: 0 .5rem;
}
#middle-page .q-page-container {
}
#bottom-post-entry-placeholder {
}

#bottom-menu,
#bottom-menu-placeholder {
  height: 2rem;
  min-height: 2rem;
  width: 100%;
}

#bottom-drawer {
  background: $dark;
  width: calc(100% - 4px);
  left: 2px;
}
#bottom-drawer > div {
  width: 100%;
}
#navagation-buttons .q-fab__actions .q-btn{
  background: $dark !important;
}
#navagation-buttons .q-btn{
  font-size: .8rem;
}
.q-page-sticky {
  z-index: 2;
}
.q-fab__actions--left {
  margin: 0;
}

@media screen and (min-width: 600px) {
  body {
    height: unset;
    overflow: unset;
  }
  #navagation-buttons .q-btn{
    font-size: .8rem;
  }
  #layout-container {
    justify-content: flex-start;
    overflow: hidden;
    height: 100vh;
  }
  #left-drawer {
    display: flex;
    overflow: hidden;
    width: 50px;
    max-width: 50px;
    min-width: 50px;
    flex: 0;
    flex-shrink: 0;
    flex-grow: 0;
  }
  #middle-page {
    display: flex;
    flex-direction: column;
    width: 100%;
    min-width: 550px;
    max-width: 650px;
    height: 100vh;
    padding-bottom: 0;
    flex: 1;
    flex-shrink: 1;
    flex-grow: 1;
  }
  #middle-page .q-page-container {
    overflow: auto;
    height: 100%;
    flex: 1;
    flex-shrink: 1;
    flex-grow: 1;
  }
  #post-entry {
    height: fit-content;
    flex: 0;
    flex-shrink: 0;
    flex-grow: 0;
  }
  #bottom-menu,
  #bottom-menu-placeholder,
  #bottom-post-entry-placeholder {
    display: none;
  }
}

@media screen and (min-width: 700px) {
  #layout-container {
    justify-content: flex-start;
    overflow: hidden;
    height: 100vh;
  }
  #left-drawer, #right-drawer {
    display: flex;
    visibility: inherit;
    height: auto;
    -webkit-overflow-scrolling: touch;
    -ms-overflow-style: none;
  }
  #right-drawer {
    width: auto;
    max-width: 300px;
    overflow-y: auto;
    overflow-x: hidden;
    flex: 1;
    flex-shrink: 1;
    flex-grow: 1;
  }
  #middle-page {
    min-width: 400px;
    max-width: 600px;
  }
}
@media screen and (min-width: 1023px) {
  #left-drawer {
    width: 200px;
    min-width: 200px;
    max-width: 300px;
  }
  #middle-page {
    width: 600px;
    min-width: 600px;
    max-width: 600px;
    flex: 0;
    flex-shrink: 0;
    flex-grow: 0;
  }
  #navagation-buttons .q-btn{
    font-size: .9rem;
  }
}
@media screen and (min-width: 1100px) {
  #left-drawer {
    width: 200px;
    min-width: 200px;
    max-width: 300px;
    flex: 1;
    flex-shrink: 1;
    flex-grow: 1;
  }
  #right-drawer {
    width: 300px;
    min-width: 300px;
    max-width: 300px;
    flex: 0;
    flex-shrink: 0;
    flex-grow: 0;
  }
}
@media screen and (min-width: 1200px) {
  #layout-container {
    justify-content: center;
  }
  #left-drawer, #right-drawer {
    width: calc((100vw - 600px) / 2);
    max-width: 300px;
    flex: 1;
    flex-shrink: 1;
    flex-grow: 1;
  }
  #middle-page {
    width: 600px;
    min-width: 600px;
    max-width: 600px;
    flex: 0;
    flex-shrink: 0;
    flex-grow: 0;
  }
}
</style>
