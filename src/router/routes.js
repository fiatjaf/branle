const routes = [
  {
    path: '/',
    component: () => import('layouts/MainLayout.vue'),
    children: [
      {
        path: '/',
        component: () => import('pages/Home.vue'),
        name: 'home'
      },
      {
        path: '/follow',
        component: () => import('pages/SearchFollow.vue'),
        name: 'follow'
      },
      {
        path: '/settings',
        component: () => import('pages/Settings.vue'),
        name: 'settings'
      },
      {
        path: '/event/:eventId',
        component: () => import('pages/Event.vue'),
        name: 'event'
      },
      {
        path: '/notifications',
        component: () => import('pages/Notifications.vue'),
        name: 'notifications'
      },
      {
        path: '/:pubkey',
        component: () => import('pages/Profile.vue'),
        name: 'profile'
      }
    ]
  },
  {
    path: '/:catchAll(.*)*',
    component: () => import('pages/Error404.vue')
  }
]

export default routes
