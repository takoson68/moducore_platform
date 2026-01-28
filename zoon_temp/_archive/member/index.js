// src/modules/member/index.js
import { routes } from "./routes.js";
import { createMemberStore } from "./store/createMemberStore.js";

export default {
  name: "member",
  routes,

  setup: {
    stores: {
      memberStore: createMemberStore,
    },
    routes,
  },
};
