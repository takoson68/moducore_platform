// modules/notification/index.js
import { routes } from "./routes.js";
import { createNotificationStore } from "./store/createNotificationStore.js";
import NotificationBell from "./components/NotificationBell.vue";
//- 任何會被跨模組主動呼叫的能力，必須在平台啟動時完成註冊，不得依賴 lazy module 載入。

export default {
  name: "notification",
  setup: {
    stores: {
      notificationStore: createNotificationStore,
    },
    routes,
    ui: {
      slots: {
        "header:right": {
          // 建議使用同步元件，避免 async loader 造成 slot 註冊/渲染時序問題。
          component: NotificationBell,
          order: 10,
        },
      },
    },
  },
};
