import {route} from 'quasar/wrappers'
import {createRouter, createWebHistory, createWebHashHistory} from 'vue-router'
import routes from './routes'

export default route(() => {
  const createHistory =
    process.env.VUE_ROUTER_MODE === 'history'
      ? createWebHistory
      : createWebHashHistory

  const Router = createRouter({
    scrollBehavior: () => ({left: 0, top: 0}),
    routes,

    // Leave this as is and make changes in quasar.conf.js instead!
    // quasar.conf.js -> build -> vueRouterMode
    // quasar.conf.js -> build -> publicPath
    history: createHistory(
      process.env.MODE === 'ssr' ? void 0 : process.env.VUE_ROUTER_BASE
    )
  })

  return Router
})
