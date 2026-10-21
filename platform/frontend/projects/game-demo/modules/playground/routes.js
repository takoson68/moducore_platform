export const routes = [{
  path: '/',
  name: 'game-playground',
  component: () => import('./pages/index.vue'),
  meta: { access: { public: true, auth: true }, nav: [] },
}];
