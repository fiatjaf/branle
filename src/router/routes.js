const routes = [
  {
    path: '/',
    component: () => import('layouts/MainLayout.vue'),
    children: [
      {path: '', component: () => import('pages/Home.vue'), name: 'home'},
      {
        path: '/messages',
        component: () => import('pages/Messages.vue'),
        name: 'messages'
      },
      {path: '/chat/:pubkey', component: () => import('pages/Chat.vue')},
      {
        path: '/user/:pubkey',
        component: () => import('pages/Profile.vue')
      },
      {
        path: '/notifications',
        component: () => import('pages/Notifications.vue')
      },
      {
        path: '/settings',
        component: () => import('pages/Settings.vue'),
        name: 'settings'
      },
      {
        path: '/help',
        component: () => import('pages/Help.vue'),
        name: 'help'
      }
    ]
  },
  {
    path: '/:catchAll(.*)*',
    component: () => import('pages/Error404.vue')
  }
]

export default routes
