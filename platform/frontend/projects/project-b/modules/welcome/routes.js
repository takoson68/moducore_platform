export const routes = [{
  path: '/',
  meta: {
    access: {
      public: true,
      auth: true
    },
    nav: [
      { area: 'sidebar', label: 'Welcome', order: 1 },
      { area: 'topbar', label: 'Welcome', order: 1 }
    ]
  }
}]
