import { routes } from './routes.js'
import { createCounterStore } from './store.js'

export default {
  name: 'counter',
  setup: {
    stores: {
      dineCoreCounterStore: createCounterStore
    },
    routes
  }
}
