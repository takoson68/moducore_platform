export const routes = [{
  path: '/task',
  component: () => import('./pages/TaskPage.vue'),
  meta: {
    title: '任務交辦',
    description: '登入後可查看任務，manager 擁有更完整的管理能力。',
    access: {
      public: false,
      auth: true
    },
    nav: [
      { area: 'sidebar', label: '任務', order: 50 }
    ]
  }
}]
