// modules/task/index.js
import { routes } from "./routes.js";
import { createTaskStore } from "./store.js";

export default {
  name: "task",
  setup: {
    stores: {
      taskStore: createTaskStore,
    },
    routes,
  },
};
