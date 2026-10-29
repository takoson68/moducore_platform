export const routes = [
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
