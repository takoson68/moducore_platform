// modules/employee/index.js
import { routes } from "./routes.js";
import { createEmployeeStore } from "./store.js";

export default {
  name: "employee",
  setup: {
    stores: {
      employeeStore: createEmployeeStore,
    },
    routes,
  },
};
