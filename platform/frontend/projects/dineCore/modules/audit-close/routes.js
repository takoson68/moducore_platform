export const routes = [
  {
    path: '/staff/manager/audit-close',
    component: () => import('./pages/AuditClosePage.vue'),
    meta: {
      title: '營業日關帳',
      staffRoles: ['manager'],
      access: {
        public: true,
        auth: true
      }
    }
  }
]
