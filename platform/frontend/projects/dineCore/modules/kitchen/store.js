import world from '@/world.js'
import { loadKitchenOrders, updateKitchenOrderStatus } from './service.js'

export function createKitchenStore() {
  return world.createStore({
    name: 'dineCoreKitchenStore',
    defaultValue: {
      boardStatus: 'active',
      visibleStatuses: ['pending', 'preparing', 'ready'],
      orders: []
    },
    actions: {
      async load(store) {
        const orders = await loadKitchenOrders()
        store.set({
          ...store.get(),
          orders
        })
      },
      setVisibleStatuses(store, statuses = []) {
        store.set({
          ...store.get(),
          visibleStatuses: Array.isArray(statuses) ? statuses : []
        })
      },
      async setOrderStatus(store, payload) {
        await updateKitchenOrderStatus(payload.orderId, payload.orderStatus)
        const orders = await loadKitchenOrders()
        store.set({
          ...store.get(),
          orders
        })
      }
    }
  })
}
