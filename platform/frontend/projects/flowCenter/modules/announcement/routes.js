export const routes = [{
  path: '/announcement',
  component: () => import('./pages/AnnouncementPage.vue'),
  meta: {
    access: {
      public: true,
      auth: true
    },
    nav: [
      { area: 'sidebar', label: '公告', order: 40 }
    ]
  }
}]
