// src/modules/moduleTemp/routes.js

export const routes = [
  {
    path: "moduleTemp",
    component: () => import("./pages/home.vue"),
    meta: {
      public: false,
      auth: false,
      nav: {
        label: "模板模組",
        order: 10,
        parent: null,
      },
    },
    children: [
      {
        path: "info",
        component: () => import("./pages/info.vue"),
        meta: {
          public: false,
          auth: true,
          nav: {
            label: "模組範例次頁",
            order: 12,
            parent: "moduleTemp",
          },
        },
      },
      {
        path: "info2",
        component: () => import("./pages/info.vue"),
        meta: {
          public: false,
          auth: true,
          nav: {
            label: "模組範例次頁22",
            order: 12,
            parent: "moduleTemp",
          },
        },
      },
    ],
  },
  {
    path: "info-standalone",
    component: () => import("./pages/info.vue"),
    meta: {
      public: false,
      auth: false,
      nav: {
        label: "模板-獨立頁",
        order: 10,
        parent: null,
      },
    },
  },
];
