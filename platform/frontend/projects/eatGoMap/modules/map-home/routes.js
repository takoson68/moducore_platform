export const routes = [
  {
    path: '/',
    name: 'eat-go-map-home',
    component: () => import('./pages/index.vue'),
    meta: {
      title: '食旅地圖',
      access: { public: true, auth: true },
      nav: []
    }
  }
]
