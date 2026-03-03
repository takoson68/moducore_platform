import { routes } from './routes.js'
import { createEntryStore } from './store.js'

export default {
  name: 'entry',
  setup: {
    stores: {
      dineCoreEntryStore: createEntryStore
    },
    routes
  }
}
