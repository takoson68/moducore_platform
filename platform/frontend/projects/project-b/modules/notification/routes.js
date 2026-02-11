//- projects/project-b/modules/notification/routes.js
export const routes = [
  {
    path: '/notifications',
    component: () => import('./pages/Layout.vue'),
    children: [
      {
        path: '',
        component: () => import('./pages/NotificationPage.vue'),
        meta: {
          access: {
            public: false,
            auth: true
          },
          nav: []
        }
      }
    ],
    meta: {
      access: {
        public: false,
        auth: true
      },
      nav: [
        { area: 'sidebar', label: '訊息通知', order: 11 },
        // { area: 'topbar', label: '訊息通知', order: 11 }
      ]
    }
  },
  {
    path: '/notification',
    redirect: '/notifications',
    meta: {
      access: {
        public: false,
        auth: true
      },
      nav: []
    }
  }
]
