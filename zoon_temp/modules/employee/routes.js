// modules/employee/routes.js

export const routes = [
  {
    path: "employee",
    component: () => import("./pages/list.vue"),
    meta: {
      public: false,
      auth: true,
      nav: {
        label: "員工管理",
        order: 20,
        parent: null,
      },
    },
  },
];
