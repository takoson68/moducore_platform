export const routes = [{
  path: '/',
  component: () => import('./pages/DashboardPage.vue'),
  meta: {
    access: {
      public: true,
      auth: true
    },
    nav: [
      { area: 'sidebar', label: '儀表板', order: 10 },
      { area: 'topbar', label: '儀表板', order: 10 }
    ]
  }
}]
