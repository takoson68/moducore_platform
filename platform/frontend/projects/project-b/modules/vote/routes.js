//- projects/project-b/modules/vote/routes.js
export const routes = [
  {
    path: '/vote',
    component: () => import('./pages/Layout.vue'),
    children: [
      {
        path: '',
        component: () => import('./pages/list.vue'),
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
        { area: 'sidebar', label: '投票中心', order: 40 },
        // { area: 'topbar', label: '投票中心', order: 40 }
      ]
    }
  },
]
