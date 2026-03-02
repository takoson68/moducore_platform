export const routes = [{
  path: '/approval',
  component: () => import('./pages/ApprovalPage.vue'),
  meta: {
    access: {
      public: true,
      auth: true
    },
    nav: [
      { area: 'sidebar', label: '審核', order: 60 }
    ]
  }
}]
