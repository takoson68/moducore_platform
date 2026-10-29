export const routes = [
  {
    path: '/console',
    name: 'chatcore-console',
    component: () => import('./pages/index.vue'),
    meta: {
      title: 'chatCore 控制台',
      access: { public: true, auth: true },
      nav: []
    }
  }
]
