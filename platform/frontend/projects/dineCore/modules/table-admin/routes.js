export const routes = [
  {
    path: '/staff/manager/tables',
    component: () => import('./pages/TableAdminPage.vue'),
    meta: {
      title: '桌號管理',
      staffRoles: ['counter', 'deputy_manager', 'manager'],
      access: {
        public: true,
        auth: true
      }
    }
  }
]
