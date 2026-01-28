// modules/shell/routes.js
export const routes = [
  {
    path: "",
    component: () => import("./pages/home.vue"),
    meta: {
      public: true,
      auth: true,
      nav: {
        label: "首頁",
        order: 1,
        parent: null,
      },
    },
  },
  {
    path: "about",
    component: () => import("./pages/about.vue"),
    meta: {
      public: true,
      auth: true,
      nav: {
        label: "About",
        order: 2,
        parent: null,
      },
    },
  },
  {
    path: "landing",
    component: () => import("./pages/Landing.vue"),
    meta: {
      public: true,
      auth: true,
      nav: {
        label: "Landing",
        order: 1,
        parent: null,
      },
    },
  },
  {
    path: "login",
    component: () => import("./pages/login.vue"),
    meta: {
      public: false,
      auth: false,
      hidden: true,
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
