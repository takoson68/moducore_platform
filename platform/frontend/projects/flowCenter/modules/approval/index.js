import { routes } from './routes.js'
import { createApprovalStore } from './store.js'

export default {
  name: 'approval',
  setup: {
    stores: {
      flowCenterApprovalStore: createApprovalStore
    },
    routes
  }
}
