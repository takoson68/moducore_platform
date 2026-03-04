export const routes = [
  {
    path: '/staff/manager/dashboard',
    component: () => import('./pages/DashboardPage.vue'),
    meta: {
      title: '營運儀表板',
      staffRoles: ['deputy_manager', 'manager'],
      access: {
        public: true,
        auth: true
      }
    }
  }
]
