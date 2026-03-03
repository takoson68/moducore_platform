export const routes = [
  {
    path: '/staff/manager/audit-close',
    component: () => import('./pages/AuditClosePage.vue'),
    meta: {
      title: '關帳與稽核',
      staffRoles: ['manager'],
      access: {
        public: true,
        auth: true
      }
    }
  }
]
