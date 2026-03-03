import { routes } from './routes.js'
import { createKitchenStore } from './store.js'

export default {
  name: 'kitchen',
  setup: {
    stores: {
      dineCoreKitchenStore: createKitchenStore
    },
    routes
  }
}
