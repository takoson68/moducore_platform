import { routes } from './routes.js'
import { createAnnouncementStore } from './store.js'

export default {
  name: 'announcement',
  setup: {
    stores: {
      flowCenterAnnouncementStore: createAnnouncementStore
    },
    routes
  }
}
