import { routes } from './routes.js'
import { createOrderTrackerStore } from './store.js'

export default {
  name: 'order-tracker',
  setup: {
    stores: {
      dineCoreOrderTrackerStore: createOrderTrackerStore
    },
    routes
  }
}
