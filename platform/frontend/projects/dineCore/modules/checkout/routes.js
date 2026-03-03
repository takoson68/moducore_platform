export const routes = [
  {
    path: '/t/:tableCode/checkout',
    component: () => import('./pages/CheckoutPage.vue'),
    meta: {
      title: '確認訂單',
      access: {
        public: true,
        auth: true
      }
    }
  },
  {
    path: '/t/:tableCode/checkout/success/:orderId',
    component: () => import('./pages/CheckoutSuccessPage.vue'),
    meta: {
      title: '送單成功',
      access: {
        public: true,
        auth: true
      }
    }
  }
]
