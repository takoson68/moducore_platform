// modules/shell/routes.js

export const routes = [
  {
    path: "",
    component: () => import("./pages/home.vue"),
    meta: {
      public: true,
      auth: true,
      nav: {
        label: "內部管理系統介紹",
        order: 1,
        parent: null,
      },
    },
  },
  {
    path: "403",
    component: () => import("./pages/403.vue"),
    meta: {
      public: true,
      auth: true,
      hidden: true,
    },
  },
  {
    path: ":pathMatch(.*)*",
    component: () => import("./pages/404.vue"),
    meta: {
      public: true,
      auth: true,
      hidden: true,
    },
  },
];
