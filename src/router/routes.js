const routes = [
  {
    path: '/',
    component: () => import('layouts/MainLayout.vue'),
    children: [
      {path: '', component: () => import('pages/Home.vue'), name: 'home'},
      {
        path: '/settings',
        component: () => import('pages/Settings.vue'),
        name: 'settings'
      },
      {
        path: '/messages',
        component: () => import('pages/Messages.vue'),
        name: 'messages'
      },
      {path: '/messages/:pubkey', component: () => import('pages/Chat.vue')},
      {
        path: '/notifications',
        component: () => import('pages/Notifications.vue')
      },
      {
        path: '/:pubkey',
        component: () => import('pages/Profile.vue')
      }
    ]
  },
  {
    path: '/:catchAll(.*)*',
    component: () => import('pages/Error404.vue')
  }
]

export default routes
