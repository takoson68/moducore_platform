export const routes = [
  {
    path: '/t/:tableCode/order/:orderId',
    component: () => import('./pages/OrderTrackerPage.vue'),
    meta: {
      title: '訂單追蹤',
      access: {
        public: true,
        auth: true
      }
    }
  }
]
