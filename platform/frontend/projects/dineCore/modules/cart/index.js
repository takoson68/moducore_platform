import { routes } from './routes.js'
import { createCartStore } from './store.js'

export default {
  name: 'cart',
  setup: {
    stores: {
      dineCoreCartStore: createCartStore
    },
    routes
  }
}
