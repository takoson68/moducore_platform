export const routes = [
  {
    path: '/t/:tableCode/cart',
    component: () => import('./pages/CartPage.vue'),
    meta: {
      title: '購物車',
      access: {
        public: true,
        auth: true
      }
    }
  }
]
