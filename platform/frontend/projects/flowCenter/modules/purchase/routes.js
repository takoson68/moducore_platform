export const routes = [{
  path: '/purchase',
  component: () => import('./pages/PurchasePage.vue'),
  meta: {
    title: '採購申請',
    description: '員工建立採購申請，company-b 不提供此模組。',
    access: {
      public: false,
      auth: true
    },
    // `identityAccess` 用於描述登入後的角色 / 公司限制。
    identityAccess: {
      roles: ['employee'],
      excludeCompanies: ['company-b']
    },
    nav: [
      { area: 'sidebar', label: '採購', order: 30 }
    ]
  }
}]
