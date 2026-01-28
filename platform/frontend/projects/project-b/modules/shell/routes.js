//- projects/project-b/modules/shell/routes.js
export const routes = [
  {
    path: '/',
    component: () => import('./pages/home.vue'),
    meta: {
      access: {
        public: true,
        auth: true
      },
      nav: [
        // { area: 'sidebar', label: '內部管理系統介紹', order: 1 },
        { area: 'topbar', label: '內部管理系統介紹', order: 1 }
      ]
    }
  },
  {
    path: '/403',
    component: () => import('./pages/403.vue'),
    meta: {
      access: {
        public: true,
        auth: true
      },
      nav: []
    }
  },
  {
    path: '/:pathMatch(.*)*',
    component: () => import('./pages/404.vue'),
    meta: {
      access: {
        public: true,
        auth: true
      },
      nav: []
    }
  }
]

