// modules/vote/routes.js

export const routes = [
  {
    path: "vote",
    component: () => import("./pages/list.vue"),
    meta: {
      public: false,
      auth: true,
      nav: {
        label: "投票中心",
        order: 40,
        parent: null,
      },
    },
  },
  {
    path: "vote/create",
    component: () => import("./pages/list.vue"),
    meta: {
      public: false,
      auth: true,
      nav: {
        label: "新增投票",
        order: 41,
        parent: "/vote",
      },
      hidden: true,
    },
  },
  {
    path: "vote/:id",
    component: () => import("./pages/list.vue"),
    meta: {
      public: false,
      auth: true,
      nav: {
        label: "投票詳情",
        order: 42,
        parent: "/vote",
      },
      hidden: true,
    },
  },
];
