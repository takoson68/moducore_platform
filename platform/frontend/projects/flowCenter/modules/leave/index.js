import { routes } from './routes.js'
import { createLeaveStore } from './store.js'

export default {
  name: 'leave',
  setup: {
    stores: {
      flowCenterLeaveStore: createLeaveStore
    },
    routes
  }
}
