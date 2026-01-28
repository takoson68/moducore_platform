// modules/moduleTemp/index.js
import { routes } from "./routes.js";
import { createStore } from "./store/createStore.js";
// import { meta } from './meta.js'

export default {
  /** 模組唯一名稱（= tenant config key） */
  /** 模組中繼資料（GUI / 平台可讀） */
  name: "moduleTemp",
  setup: {
    stores: {
      moduleTemp: createStore,
    },
    routes,
  },
};
