export const routes = [
  {
    path: '/',
    component: () => import('./pages/EntryLandingPage.vue'),
    meta: {
      title: 'DineCore 入口',
      access: {
        public: true,
        auth: true
      }
    }
  },
  {
    path: '/t/:tableCode',
    component: () => import('./pages/EntryLandingPage.vue'),
    meta: {
      title: '桌號入口',
      access: {
        public: true,
        auth: true
      }
    }
  },
  {
    path: '/t/:tableCode/unavailable',
    component: () => import('./pages/EntryUnavailablePage.vue'),
    meta: {
      title: '暫停接單',
      access: {
        public: true,
        auth: true
      }
    }
  }
]
