import { routes } from './routes.js'
import { createPurchaseStore } from './store.js'

export default {
  name: 'purchase',
  setup: {
    stores: {
      flowCenterPurchaseStore: createPurchaseStore
    },
    routes
  }
}
