// modules/dashboard/routes.js

export const routes = [
  {
    path: "dashboard",
    component: () => import("./pages/index.vue"),
    meta: {
      public: false,
      auth: true,
      nav: {
        label: "資訊總覽",
        order: 10,
        parent: null,
      },
    },
  },
];
