const routes = [
  {
    path: '/',
    component: () => import('layouts/MainLayout.vue'),
    children: [
      { path: '', component: () => import('pages/IndexPage.vue') },
      {
        path: '/feed',
        component: () => import('pages/Feed.vue'),
        name: 'feed',
      },
      // {
      //   path: '/home',
      //   component: () => import('pages/Home.vue'),
      //   name: 'home',
      // },
      {
        path: '/follow',
        component: () => import('pages/SearchFollow.vue'),
        name: 'follow',
      },
      {
        path: '/settings',
        component: () => import('pages/Settings.vue'),
        name: 'settings',
      },
      {
        path: '/messages/inbox',
        component: () => import('pages/Inbox.vue'),
        name: 'inbox',
        // children: [
        //   {
        //     path: 'inbox',
        //     component: () => import('pages/Inbox.vue'),
        //     name: 'inbox'
        //   },
        //   {
        //     path: '/messages/:pubkey',
        //     component: () => import('pages/Messages.vue'),
        //     name: 'messages'
        //   }
        // ],
        // redirect: { name: 'inbox' }
      },
      {
        path: '/messages/:pubkey([a-f0-9A-F]{64})',
        component: () => import('pages/Messages.vue'),
        name: 'messages',
      },
      {
        path: '/event/:eventId([a-f0-9A-F]{64})',
        component: () => import('pages/Event.vue'),
        name: 'event',
      },
      {
        path: '/notifications',
        component: () => import('pages/Notifications.vue'),
        name: 'notifications',
      },
      {
        path: '/:pubkey([a-f0-9A-F]{64})',
        component: () => import('pages/Profile.vue'),
        name: 'profile',
      },
      {
        path: '/hashtag/:hashtagId([a-zA-Z0-9_]{1,63})',
        component: () => import('pages/Hashtag.vue'),
        name: 'hashtag',
      },
      {
        path: '/:catchAll(.*)*',
        component: () => import('pages/ErrorNotFound.vue'),
      },
    ],
  },

  // Always leave this as last one,
  // but you can also remove it
]

export default routes
