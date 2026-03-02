//- projects/modudesk/modules/sticky-board/routes.js

export const routes = [
  {
    path: '/',
    name: 'modudesk-root-redirect',
    redirect: '/sticky',
    meta: {
      access: {
        public: true,
        auth: true,
      },
      order: -20,
    },
  },
  {
    path: '/sticky',
    name: 'modudesk-sticky-board',
    component: () => import('./pages/StickyBoardPage.vue'),
    meta: {
      access: {
        public: true,
        auth: true,
      },
      order: -10,
    },
  },
]
