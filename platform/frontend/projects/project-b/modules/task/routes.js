//- projects/project-b/modules/task/routes.js
export const routes = [
  {
    path: '/task',
    component: () => import('./pages/Layout.vue'),
    children: [
      {
        path: '',
        component: () => import('./pages/board.vue'),
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
        { area: 'sidebar', label: '任務看板', order: 30 },
        // { area: 'topbar', label: '任務看板', order: 30 }
      ]
    }
  }
]
