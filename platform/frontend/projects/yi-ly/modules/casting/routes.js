export const routes = [
  {
    path: '/',
    component: () => import('./pages/index.vue'),
    meta: {
      access: {
        public: true,
        auth: true,
      },
      nav: [],
    },
  },
]
