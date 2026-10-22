export const routes = [{
  path: '/',
  name: 'magic-siege-battlefield',
  component: () => import('./pages/index.vue'),
  meta: { access: { public: true, auth: true }, nav: [] },
}];
