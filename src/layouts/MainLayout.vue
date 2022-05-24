<template>
  <q-layout>
    <TheKeyInitializationDialog/>
    <div id='layout-container' :ripple='false'>
      <div id='left-drawer' class='flex justify-end'>
        <TheUserMenu/>
      </div>

      <div id='middle-page'>
        <q-page-container v-if="$store.state.keys.pub"  ref='pageContainer'>
          <!-- <router-view :key='$route.path' /> -->
          <router-view v-slot="{ Component }">
            <keep-alive  >
              <component :is="Component" :key='$route.path' @scroll-to-rect='scrollToRect'/>
            </keep-alive>
          </router-view>
        </q-page-container>
        <q-footer id='bottom-drawer' unelevated class='z-max'>
          <TheUserMenu :compact-mode='true'/>
        </q-footer>
      </div>

      <div id='right-drawer' class='flex justify-start'>
        <TheSearchMenu/>
      </div>
    </div>
    <q-page-sticky position="top-right" :offset="fabPos" id='navagation-buttons'>
      <q-fab
        icon="drag_indicator"
        active-icon="drag_indicator"
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
        <q-btn
          @click.prevent="$router.go(1)"
          color="primary"
          unelevated
          round
          outline
          icon="keyboard_arrow_right"
          :disable="draggingFab"
        />
        <q-btn
          v-if='$route.name !== "inbox" && $route.name !== "messages"'
          @click.prevent="scrollToTop"
          color="primary"
          unelevated
          round
          outline
          icon="keyboard_double_arrow_up"
          :disable="draggingFab"
        />
        <q-btn
          @click.prevent="$router.go(-1)"
          color="primary"
          unelevated
          round
          outline
          icon="keyboard_arrow_left"
          :disable="draggingFab"
        />
      </q-fab>
    </q-page-sticky>
  </q-layout>
</template>

<script>
import { defineComponent} from 'vue'
import { scroll } from 'quasar'
const { getVerticalScrollPosition, setVerticalScrollPosition} = scroll
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

  data() {
    return {
      middlePagePos: {},
      fabPos: [0, 10],
      draggingFab: false,
    }
  },

  mounted() {
    document.querySelector('#left-drawer').addEventListener('wheel', this.redirectScroll)
    this.$router.beforeEach((to, from) => { this.preserveScrollPos(to, from) })
    this.$router.afterEach((to, from) => { this.restoreScrollPos(to, from) })
    let pageRect = this.$refs.pageContainer?.$el.getBoundingClientRect()
    if (pageRect) this.fabPos[0] = pageRect.right - pageRect.width
  },

  beforeUnmount() {
    document.querySelector('#left-drawer').removeEventListener('wheel', this.redirectScroll)
  },

  methods: {
    redirectScroll(event) {
      let pos = getVerticalScrollPosition(this.$refs.pageContainer.$el)
      setVerticalScrollPosition(this.$refs.pageContainer.$el, pos + event.deltaY)
    },

    preserveScrollPos(to, from) {
      if (this.$refs.pageContainer?.$el) this.middlePagePos[from.fullPath] = getVerticalScrollPosition(this.$refs.pageContainer.$el)
    },

    restoreScrollPos(to, from) {
      if (this.$refs.pageContainer?.$el) {
        if (this.middlePagePos[to.fullPath]) setVerticalScrollPosition(this.$refs.pageContainer.$el, this.middlePagePos[to.fullPath], 500)
        else setVerticalScrollPosition(this.$refs.pageContainer.$el, 0)
      }
    },

    scrollToTop() {
      setVerticalScrollPosition(this.$refs.pageContainer.$el, 0, 500)
    },

    moveBackFab (ev) {
      this.fabBackDragged = ev.isFirst !== true && ev.isFinal !== true

      this.fabBackPos = [
        this.fabBackPos[0] + ev.delta.x,
        this.fabBackPos[1] - ev.delta.y
      ]
    },

    moveTopFab (ev) {
      this.fabTopDragged = ev.isFirst !== true && ev.isFinal !== true

      this.fabTopPos = [
        this.fabTopPos[0] + ev.delta.x,
        this.fabTopPos[1] + ev.delta.y
      ]
    },

    moveFab (ev) {
      this.draggingFab = ev.isFirst !== true && ev.isFinal !== true

      this.fabPos = [
        this.fabPos[0] - ev.delta.x,
        this.fabPos[1] + ev.delta.y
      ]
    },

    scrollToRect(rect) {
      let pageRect = this.$refs.pageContainer?.$el.getBoundingClientRect()
      let offset = Math.max(rect.bottom - (pageRect.height / 2), 0)
      setVerticalScrollPosition(this.$refs.pageContainer.$el, offset, 500)
    }
  },
})

</script>

<style lang='scss'>
#layout-container {
  display: flex;
  justify-content: center;
  overflow: hidden;
  height: 100vh;
  position: relative;
  width: 100%;
  will-change: overflow;
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
  overflow-y: auto;
}
#bottom-drawer {
  background: rgba(255, 255, 255, 0.2);
}
#navagation-buttons .q-btn{
  font-size: .6rem;
}
.q-fab__actions--left {
  margin: 0;
}

@media screen and (min-width: 600px) {
  #navagation-buttons .q-btn{
    font-size: .8rem;
  }
}

@media screen and (min-width: 700px) {
  #layout-container {
    justify-content: flex-start;
  }
  #left-drawer, #right-drawer {
    display: flex;
    visibility: inherit;
    height: auto;
    -webkit-overflow-scrolling: touch;
    -ms-overflow-style: none;
  }
  #left-drawer {
    overflow: hidden;
    width: 50px;
    max-width: 50px;
    min-width: 50px;
    flex: 0;
    flex-shrink: 0;
    flex-grow: 0;
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
    padding-bottom: 0;
    flex: 1;
    flex-shrink: 1;
    flex-grow: 1;
  }
  #bottom-drawer {
    display: none;
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
