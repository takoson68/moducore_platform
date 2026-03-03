import { routes } from './routes.js'
import { createCheckoutStore } from './store.js'

export default {
  name: 'checkout',
  setup: {
    stores: {
      dineCoreCheckoutStore: createCheckoutStore
    },
    routes
  }
}
