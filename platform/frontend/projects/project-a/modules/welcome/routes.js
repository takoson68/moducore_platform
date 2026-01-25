//- projects/project-a/modules/welcome/routes.js
export const routes = [{
  path: '/',
  meta: {
    access: {
      public: true,
      auth: true
    },
    nav: [
      { area: 'sidebar', label: '歡迎光臨', order: 1 },
      { area: 'topbar', label: '歡迎光臨', order: 1 }
    ]
  }
}]
