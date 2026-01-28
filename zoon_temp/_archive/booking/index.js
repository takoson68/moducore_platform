// - src/modules/booking/index.js
// booking 模組入口（routes + store）
import { createBookingStore } from './store/index.js'
export default {
  name: 'booking',
  setup: {
    stores: {
      bookingStore: createBookingStore,
    },
    // routes,
  },
}
