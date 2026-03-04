export const routes = [
  {
    path: '/staff/counter/orders',
    component: () => import('./pages/CounterOrdersPage.vue'),
    meta: {
      title: '櫃台訂單總覽',
      staffRoles: ['counter', 'deputy_manager', 'manager'],
      access: {
        public: true,
        auth: true
      }
    }
  },
  {
    path: '/staff/counter/orders/:orderId',
    component: () => import('./pages/CounterOrderDetailPage.vue'),
    meta: {
      title: '櫃台訂單明細',
      staffRoles: ['counter', 'deputy_manager', 'manager'],
      access: {
        public: true,
        auth: true
      }
    }
  }
]
