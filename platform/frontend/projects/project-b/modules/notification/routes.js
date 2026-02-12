//- projects/project-b/modules/notification/routes.js
export const routes = [
  {
    path: '/notifications',
    component: () => import('./pages/index.vue'),
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
