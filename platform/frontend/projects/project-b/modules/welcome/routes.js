//- projects/project-b/modules/welcome/routes.js
export const routes = [{
  path: '/',
  meta: {
    access: {
      public: false,
      auth: false
    },
    nav: [
      // { area: 'sidebar', label: 'Welcome', order: 1 },
      { area: 'topbar', label: 'Welcome', order: 1 }
    ]
  }
}]

