export const routes = [{
  path: '/',
  component: () => import('./pages/DashboardPage.vue'),
  meta: {
    title: '個人儀表板',
    description: '依登入身份顯示摘要、公告與任務近況。',
    access: {
      public: true,
      auth: true
    },
    nav: [
      { area: 'sidebar', label: '儀表板', order: 10 },
      { area: 'topbar', label: '儀表板', order: 10, display: false }
    ]
  }
}]
