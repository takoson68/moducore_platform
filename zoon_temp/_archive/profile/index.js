// src/modules/profile/index.js
import { routes } from "./routes.js";

export default {
  name: "profile",
  setup: {
    stores: {
      // moduleTemp: createStore,
    },
    routes,
  },
};
