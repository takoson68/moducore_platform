// modules/notification/routes.js

export const routes = [
  {
    path: "notifications",
    component: () => import("./pages/NotificationPage.vue"),
    meta: {
      public: false,
      auth: true,
      nav: {
        label: "訊息通知",
        order: 11,
        parent: null,
      },
    },
  },
  {
    path: "notification",
    redirect: "/notifications",
    meta: {
      public: false,
      auth: true,
      hidden: true,
    },
  },
];
