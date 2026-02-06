//- projects/project-a/modules/approval-center/routes.js
export const routes = [{
  path: '/approvals',
  meta: {
    access: {
      public: false,
      auth: true
    },
    nav: [
      { area: 'sidebar', label: '審批中心', order: 6 },
      { area: 'topbar', label: '審批中心', order: 6 }
    ]
  }
}]
