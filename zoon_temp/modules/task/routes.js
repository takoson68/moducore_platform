// modules/task/routes.js

export const routes = [
  {
    path: "task",
    component: () => import("./pages/board.vue"),
    meta: {
      public: false,
      auth: true,
      nav: {
        label: "任務看板",
        order: 30,
        parent: null,
      },
    },
  },
];
