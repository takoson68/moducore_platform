export const routes = [
  {
    path: '/t/:tableCode/menu',
    component: () => import('./pages/MenuPage.vue'),
    meta: {
      title: '菜單',
      access: {
        public: true,
        auth: true
      }
    }
  }
]
