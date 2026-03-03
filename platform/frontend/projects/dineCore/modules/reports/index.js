import { routes } from './routes.js'
import { createReportsStore } from './store.js'

export default {
  name: 'reports',
  setup: {
    stores: {
      dineCoreReportsStore: createReportsStore
    },
    routes
  }
}
