export const routes = [
  {
    path: '/staff/manager/menu-items',
    component: () => import('./pages/MenuAdminPage.vue'),
    meta: {
      title: '商品管理',
      staffRoles: ['deputy_manager', 'manager'],
      access: {
        public: true,
        auth: true
      }
    }
  }
]
