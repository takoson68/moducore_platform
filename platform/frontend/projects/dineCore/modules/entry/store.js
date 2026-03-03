import world from '@/world.js'
import { loadEntryContext } from './service.js'

export function createEntryStore() {
  return world.createStore({
    name: 'dineCoreEntryStore',
    defaultValue: {
      tableCode: '',
      tableName: '',
      dineMode: 'dine_in',
      tableStatus: 'unknown',
      orderingEnabled: true,
      latestOrderId: '',
      latestOrderNo: '',
      latestOrderStatus: ''
    },
    actions: {
      async loadTableContext(store, tableCode) {
        const payload = await loadEntryContext(tableCode)
        store.set({
          ...store.get(),
          tableCode: payload.code,
          tableName: payload.name,
          dineMode: payload.dine_mode,
          tableStatus: payload.status,
          orderingEnabled: payload.is_ordering_enabled,
          latestOrderId: payload.latest_order_id || '',
          latestOrderNo: payload.latest_order_no || '',
          latestOrderStatus: payload.latest_order_status || ''
        })
      },
      setTableContext(store, payload = {}) {
        const state = store.get()
        store.set({
          ...state,
          tableCode: payload.tableCode || state.tableCode,
          tableName: payload.tableName || state.tableName,
          dineMode: payload.dineMode || state.dineMode,
          tableStatus: payload.tableStatus || state.tableStatus,
          latestOrderId: payload.latestOrderId || state.latestOrderId,
          latestOrderNo: payload.latestOrderNo || state.latestOrderNo,
          latestOrderStatus: payload.latestOrderStatus || state.latestOrderStatus,
          orderingEnabled: typeof payload.orderingEnabled === 'boolean'
            ? payload.orderingEnabled
            : state.orderingEnabled
        })
      }
    }
  })
}
