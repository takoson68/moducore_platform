import { routes } from './routes.js'
import { createDashboardStore } from './store.js'

export default {
  name: 'dashboard',
  setup: {
    stores: {
      flowCenterDashboardStore: createDashboardStore
    },
    routes
  }
}
