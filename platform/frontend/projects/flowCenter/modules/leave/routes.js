export const routes = [{
  path: '/leave',
  component: () => import('./pages/LeavePage.vue'),
  meta: {
    title: '請假申請',
    description: '員工建立與追蹤自己的請假申請。',
    access: {
      public: false,
      auth: true
    },
    // `identityAccess` 用於描述登入後的角色 / 公司限制。
    identityAccess: {
      roles: ['employee']
    },
    nav: [
      { area: 'sidebar', label: '請假', order: 20 }
    ]
  }
}]
