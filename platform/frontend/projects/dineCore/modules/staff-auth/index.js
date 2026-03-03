import { createStaffAuthStore } from './store.js'

export default {
  name: 'staff-auth',
  setup: {
    stores: {
      dineCoreStaffAuthStore: createStaffAuthStore
    }
  }
}
