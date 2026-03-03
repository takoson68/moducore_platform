import { routes } from './routes.js'
import { createAuditCloseStore } from './store.js'

export default {
  name: 'audit-close',
  setup: {
    stores: {
      dineCoreAuditCloseStore: createAuditCloseStore
    },
    routes
  }
}
