import { routes } from './routes.js'
import { createVisitorStatsStore } from './store.js'

export default {
  name: 'visitor-stats',
  setup: {
    stores: {
      dineCoreVisitorStatsStore: createVisitorStatsStore
    },
    routes
  }
}
