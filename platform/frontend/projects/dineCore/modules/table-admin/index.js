import { routes } from './routes.js'
import { createTableAdminStore } from './store.js'

export default {
  name: 'table-admin',
  setup: {
    stores: {
      dineCoreTableAdminStore: createTableAdminStore
    },
    routes
  }
}
