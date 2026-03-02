export const routes = [{
  path: '/leave',
  component: () => import('./pages/LeavePage.vue'),
  meta: {
    access: {
      public: true,
      auth: true
    },
    nav: [
      { area: 'sidebar', label: '請假', order: 20 }
    ]
  }
}]
