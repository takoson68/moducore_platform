// src/modules/admin/routes.js
export const routes = [
  {
    path: "admin",
    component: () => import("./pages/AdminConsole.vue"),
    meta: {
      public: false,
      auth: true,
      nav: {
        label: "管理控制台",
        order: 20,
      },
    },
  },
];
