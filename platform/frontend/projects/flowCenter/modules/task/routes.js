export const routes = [{
  path: '/task',
  component: () => import('./pages/TaskPage.vue'),
  meta: {
    access: {
      public: true,
      auth: true
    },
    nav: [
      { area: 'sidebar', label: '任務', order: 50 }
    ]
  }
}]
