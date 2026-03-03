export const routes = [
  {
    path: '/staff/manager/reports',
    component: () => import('./pages/ReportsPage.vue'),
    meta: {
      title: '營運報表',
      staffRoles: ['deputy_manager', 'manager'],
      access: {
        public: true,
        auth: true
      }
    }
  }
]
