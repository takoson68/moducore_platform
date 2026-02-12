//- projects/project-b/modules/vote/routes.js
export const routes = [
  {
    path: '/vote',
    component: () => import('./pages/index.vue'),
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
