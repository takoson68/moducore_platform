export const routes = [
  {
    path: '/staff/manager/map-editor',
    component: () => import('./pages/RestaurantMapEditorPage.vue'),
    meta: {
      title: '餐廳地圖產生器',
      staffRoles: ['counter', 'deputy_manager', 'manager'],
      access: {
        public: true,
        auth: true
      }
    }
  }
]
