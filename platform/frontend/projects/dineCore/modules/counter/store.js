import world from '@/world.js'
import {
  loadCounterMergeCandidates,
  loadCounterTables,
  loadCounterOrderDetail,
  loadCounterOrders,
  mergeCounterOrders,
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
        paymentStatus: 'unpaid'
      },
      error: '',
      tables: [],
      orders: [],
      selectedOrderId: null,
      detail: null,
      mergeCandidates: []
    },
    actions: {
      async load(store) {
        const state = store.get()
        try {
          const [tables, orders] = await Promise.all([
            loadCounterTables(),
            loadCounterOrders(state.filters)
          ])
          store.set({
            ...state,
            error: '',
            tables,
            orders
          })
        } catch (error) {
          store.set({
            ...state,
            error: error instanceof Error ? error.message : 'COUNTER_LOAD_FAILED'
          })
        }
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
        try {
          const [detail, mergeCandidates] = await Promise.all([
            loadCounterOrderDetail(orderId),
            loadCounterMergeCandidates(orderId)
          ])
          store.set({
            ...store.get(),
            error: '',
            selectedOrderId: orderId,
            detail,
            mergeCandidates
          })
        } catch (error) {
          store.set({
            ...store.get(),
            error: error instanceof Error ? error.message : 'COUNTER_DETAIL_FAILED'
          })
        }
      },
      async setOrderStatus(store, payload) {
        try {
          await updateCounterOrderStatus(payload.orderId, payload.orderStatus, payload.note || '')
          await store.loadDetail(payload.orderId)
          await store.load()
        } catch (error) {
          store.set({
            ...store.get(),
            error: error instanceof Error ? error.message : 'COUNTER_UPDATE_FAILED'
          })
        }
      },
      async setPaymentStatus(store, payload) {
        try {
          await updateCounterPaymentStatus(payload.orderId, payload.paymentStatus)
          await store.loadDetail(payload.orderId)
          await store.load()
        } catch (error) {
          store.set({
            ...store.get(),
            error: error instanceof Error ? error.message : 'COUNTER_PAYMENT_UPDATE_FAILED'
          })
        }
      },
      async mergeOrders(store, payload) {
        try {
          await mergeCounterOrders(payload.targetOrderId, payload.mergedOrderId, payload.reason || '')
          await store.loadDetail(payload.targetOrderId)
          await store.load()
        } catch (error) {
          store.set({
            ...store.get(),
            error: error instanceof Error ? error.message : 'COUNTER_MERGE_FAILED'
          })
        }
      }
    }
  })
}
