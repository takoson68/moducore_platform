// modules/mtk2mad/routes.js

export const routes = [
  {
    path: "mtk2mad",
    component: () => {},
    meta: {
      public: false,
      auth: true,
      nav: {
        label: "攻擊進介紹",
        order: 55,
        parent: null,
      },
    },
    children: [
      {
        path: "mtk2mad",
        component: () => import("./pages/home.vue"),
        meta: {
          public: false,
          auth: true,
          nav: {
            label: "攻擊進程圖",
            order: 55,
            parent: "mtk2mad",
          },
        },
      },
      {
        path: "mdeditor",
        component: () => import("./pages/mdeditor.vue"),
        meta: {
          public: false,
          auth: true,
          nav: {
            label: "攻擊歷程報告",
            order: 56,
            parent: "mtk2mad",
          },
        },
      },
    ],
  },
];
