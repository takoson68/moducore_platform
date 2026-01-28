// src/modules/booking/store/createBookingStore.js
import { createStore } from '@/app/stores/_storeFactory.js'
// import { bookingApi } from '../api/bookingApi.js'

export function createBookingStore() {
  return createStore({
    name: 'bookingStore',
    storageKey: 'bookingStore',

    defaultValue: {
      services: [],
      loading: false,
      error: null,
      myBookings: []
    },

    actions: {

    }
  })
}
