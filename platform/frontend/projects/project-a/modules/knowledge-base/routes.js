//- projects/project-a/modules/knowledge-base/routes.js
export const routes = [{
  path: '/kb',
  meta: {
    access: {
      public: false,
      auth: true
    },
    nav: [
      { area: 'sidebar', label: '知識庫', order: 5 },
      { area: 'topbar', label: '知識庫', order: 5 }
    ]
  }
}]
