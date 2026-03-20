export const routes = [
  {
    path: '/staff/counter/map',
    component: () => import('./pages/CounterMapPage.vue'),
    meta: {
      title: '櫃檯地圖',
      staffRoles: ['counter', 'deputy_manager', 'manager'],
      access: {
        public: true,
        auth: true
      }
    }
  }
]