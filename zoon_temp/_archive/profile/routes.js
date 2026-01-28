// src/modules/profile/routes.js

export const routes = [
  {
    path: "profile",
    component: () => import("./pages/ProfilePage.vue"),
    meta: {
      public: false,
      auth: true,

      // ⭐ 關鍵：宣告這是一個導覽項目
      nav: {
        label: "個人檔案",
        order: 30,
      },
    },
  },
];
