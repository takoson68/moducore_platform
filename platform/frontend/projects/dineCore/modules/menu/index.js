import { routes } from './routes.js'
import { createMenuStore } from './store.js'

export default {
  name: 'menu',
  setup: {
    stores: {
      dineCoreMenuStore: createMenuStore
    },
    routes
  }
}
