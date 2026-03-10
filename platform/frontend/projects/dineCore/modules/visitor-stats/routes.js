export const routes = [
  {
    path: '/staff/manager/visitor-stats',
    component: () => import('./pages/VisitorStatsPage.vue'),
    meta: {
      title: '每日IP訪客統計',
      superAdminOnly: true,
      access: {
        public: true,
        auth: true
      }
    }
  }
]
