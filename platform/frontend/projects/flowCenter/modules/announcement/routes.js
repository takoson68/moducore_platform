export const routes = [{
  path: '/announcement',
  component: () => import('./pages/AnnouncementPage.vue'),
  meta: {
    title: '公告管理',
    description: '檢視公告清單，manager 可建立、更新與刪除公告。',
    access: {
      public: false,
      auth: true
    },
    nav: [
      { area: 'sidebar', label: '公告', order: 40 }
    ]
  }
}]
