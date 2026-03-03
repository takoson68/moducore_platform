export const routes = [
  {
    path: '/staff/kitchen/board',
    component: () => import('./pages/KitchenBoardPage.vue'),
    meta: {
      title: '廚房看板',
      staffRoles: ['kitchen', 'deputy_manager', 'manager'],
      access: {
        public: true,
        auth: true
      }
    }
  }
]
