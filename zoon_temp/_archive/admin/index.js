// src/modules/admin/index.js
import { routes } from "./routes.js";

export default {
  name: "admin",
  meta: {
    auth: true,
  },
  setup: {
    // 目前不新增功能：setup 可以先留空或回傳標記
    routes,
  },
};
