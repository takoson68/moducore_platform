import world from '@/world.js'
import {
  loadCounterOrderDetail,
  loadCounterOrders,
  updateCounterOrderStatus,
  updateCounterPaymentStatus
} from './service.js'

export function createCounterStore() {
  return world.createStore({
    name: 'dineCoreCounterStore',
    defaultValue: {
      filters: {
        tableCode: '',
        orderNo: '',
        orderStatus: 'all',
        paymentStatus: 'all'
      },
      orders: [],
      selectedOrderId: null,
      detail: null
    },
    actions: {
      async load(store) {
        const state = store.get()
        const orders = await loadCounterOrders(state.filters)
        store.set({
          ...state,
          orders
        })
      },
      setFilters(store, patch = {}) {
        const state = store.get()
        store.set({
          ...state,
          filters: {
            ...state.filters,
            ...patch
          }
        })
      },
      setSelectedOrder(store, orderId) {
        store.set({
          ...store.get(),
          selectedOrderId: orderId
        })
      },
      async loadDetail(store, orderId) {
        const detail = await loadCounterOrderDetail(orderId)
        store.set({
          ...store.get(),
          selectedOrderId: orderId,
          detail
        })
      },
      async setOrderStatus(store, payload) {
        await updateCounterOrderStatus(payload.orderId, payload.orderStatus, payload.note || '')
        await store.loadDetail(payload.orderId)
        await store.load()
      },
      async setPaymentStatus(store, payload) {
        await updateCounterPaymentStatus(payload.orderId, payload.paymentStatus)
        await store.loadDetail(payload.orderId)
        await store.load()
      }
    }
  })
}
