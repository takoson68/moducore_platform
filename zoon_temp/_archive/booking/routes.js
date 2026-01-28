// src/modules/booking/routes.js

export const routes = [
  {
    path: "member",
    component: () => import("./pages/list.vue"),
    meta: {
      public: false,
      auth: false,

      // ⭐ 關鍵：宣告這是一個導覽項目
      nav: {
        label: "booking",
        order: 30,
      },
    },
  },
];
