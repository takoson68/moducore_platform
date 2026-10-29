export const routes = [
  {
    path: '/console',
    name: 'chatcore-focused-chat',
    component: () => import('./pages/index.vue'),
    meta: {
      title: 'chatCore 實驗控制台與聊天',
      access: { public: true, auth: true },
      nav: []
    }
  },
  {
    path: '/lab',
    name: 'chatcore-private-chat-lab',
    component: () => import('./pages/index.vue'),
    meta: {
      title: 'Private Chat Lab',
      access: { public: true, auth: true },
      nav: []
    }
  }
]
