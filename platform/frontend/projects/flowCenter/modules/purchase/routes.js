export const routes = [{
  path: '/purchase',
  component: () => import('./pages/PurchasePage.vue'),
  meta: {
    access: {
      public: true,
      auth: true
    },
    nav: [
      { area: 'sidebar', label: '採購', order: 30 }
    ]
  }
}]
