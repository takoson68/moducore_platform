//- projects/project-b/modules/employee/routes.js
export const routes = [
  {
    path: '/employee',
    component: () => import('./pages/list.vue'),
    meta: {
      access: {
        public: false,
        auth: true
      },
      nav: [
        { area: 'sidebar', label: '員工管理', order: 20 },
        // { area: 'topbar', label: '員工管理', order: 20 }
      ]
    }
  }
]

