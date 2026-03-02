export const routes = [{
  path: '/approval',
  component: () => import('./pages/ApprovalPage.vue'),
  meta: {
    title: '主管審核',
    description: '僅主管可進入待審流程並提交決策。',
    access: {
      public: false,
      auth: true
    },
    // `identityAccess` 用於描述登入後的角色 / 公司限制。
    identityAccess: {
      roles: ['manager']
    },
    nav: [
      { area: 'sidebar', label: '審核', order: 60 }
    ]
  }
}]
