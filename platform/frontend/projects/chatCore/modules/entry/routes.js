export const routes = [
  {
    path: '/',
    name: 'chatcore-entry',
    component: () => import('./pages/index.vue'),
    meta: {
      title: 'chatCore 實驗入口',
      access: { public: true, auth: true },
      nav: []
    }
  }
]
