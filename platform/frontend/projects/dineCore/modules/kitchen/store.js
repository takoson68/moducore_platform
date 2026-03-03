import world from '@/world.js'
import { loadKitchenOrders, updateKitchenOrderStatus } from './service.js'

export function createKitchenStore() {
  return world.createStore({
    name: 'dineCoreKitchenStore',
    defaultValue: {
      boardStatus: 'active',
      visibleStatuses: ['pending', 'preparing', 'ready'],
      error: '',
      orders: []
    },
    actions: {
      async load(store) {
        try {
          const orders = await loadKitchenOrders()
          store.set({
            ...store.get(),
            error: '',
            orders
          })
        } catch (error) {
          store.set({
            ...store.get(),
            error: error instanceof Error ? error.message : 'KITCHEN_LOAD_FAILED'
          })
        }
      },
      setVisibleStatuses(store, statuses = []) {
        store.set({
          ...store.get(),
          visibleStatuses: Array.isArray(statuses) ? statuses : []
        })
      },
      async setOrderStatus(store, payload) {
        try {
          await updateKitchenOrderStatus(payload.orderId, payload.orderStatus)
          const orders = await loadKitchenOrders()
          store.set({
            ...store.get(),
            error: '',
            orders
          })
        } catch (error) {
          store.set({
            ...store.get(),
            error: error instanceof Error ? error.message : 'KITCHEN_UPDATE_FAILED'
          })
        }
      }
    }
  })
}
