// modules/dashboard/index.js
import { routes } from "./routes.js";
import { createStore } from "./store.js";

export default {
  name: "dashboard",
  setup: {
    stores: {
      dashboard: createStore,
    },
    routes,
  },
};
