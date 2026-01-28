// modules/vote/index.js
import { routes } from "./routes.js";
import { createVoteStore } from "./store.js";

export default {
  name: "vote",
  setup: {
    stores: {
      voteStore: createVoteStore,
    },
    routes,
  },
};
