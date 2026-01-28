// src/modules/dashboard/routes.js

export const routes = [
  {
    path: 'dashboard',
    component: () => import("./pages/DashboardHome.vue"),
    meta: {
      public: false,
      auth: true,
      nav: {
        label: "dashboard",
        order: 10,
        parent: null,
      },
    }
  }
]
