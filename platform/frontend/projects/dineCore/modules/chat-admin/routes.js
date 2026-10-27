export const routes = [
  {
    path: '/staff/platform/chat-rooms',
    component: () => import('./pages/ChatRoomAdminPage.vue'),
    meta: {
      title: '平台聊天室管理',
      superAdminOnly: true,
      access: { public: true, auth: true }
    }
  }
]
