import { routes } from './routes.js'
import { createMenuAdminStore } from './store.js'

export default {
  name: 'menu-admin',
  setup: {
    stores: {
      dineCoreMenuAdminStore: createMenuAdminStore
    },
    routes
  }
}
