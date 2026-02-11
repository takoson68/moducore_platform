//- projects/project-b/modules/dashboard/routes.js
export const routes = [
  {
    path: '/dashboard',
    component: () => import('./pages/Layout.vue'),
    children: [
      {
        path: '',
        component: () => import('./pages/index.vue'),
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
        { area: 'sidebar', label: '資訊總覽', order: 10 },
        { area: 'topbar', label: '資訊總覽', order: 10 }
      ]
    }
  }
]
