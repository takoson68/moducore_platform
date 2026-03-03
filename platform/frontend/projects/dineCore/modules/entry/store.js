import world from '@/world.js'
import { loadEntryContext, mapEntryError } from './service.js'

export function createEntryStore() {
  return world.createStore({
    name: 'dineCoreEntryStore',
    defaultValue: {
      loading: false,
      errorMessage: '',
      tableCode: '',
      tableName: '',
      dineMode: 'dine_in',
      tableStatus: 'unknown',
      orderingEnabled: true,
      orderingSessionToken: '',
      orderingCartId: '',
      personSlot: 0,
      orderingLabel: '',
      orderId: '',
      orderNo: '',
      orderStatus: ''
    },
    actions: {
      setLoading(store, loading) {
        store.set({
          ...store.get(),
          loading: Boolean(loading)
        })
      },
      async loadTableContext(store, input) {
        const tableCode = typeof input === 'string' ? input : input?.tableCode
        const orderingSessionToken =
          typeof input === 'string' ? '' : String(input?.orderingSessionToken || '')
        store.setLoading(true)
        try {
          const payload = await loadEntryContext(tableCode, orderingSessionToken)
          store.set({
            ...store.get(),
            loading: false,
            errorMessage: '',
            tableCode: payload.code,
            tableName: payload.name,
            dineMode: payload.dine_mode,
            tableStatus: payload.status,
            orderingEnabled: payload.is_ordering_enabled,
            orderingSessionToken: payload.ordering_session_token || '',
            orderingCartId: payload.ordering_cart_id || '',
            personSlot: Number(payload.person_slot || 0),
            orderingLabel: payload.ordering_label || '',
            orderId: payload.order_id || '',
            orderNo: payload.order_no || '',
            orderStatus: payload.order_status || ''
          })
        } catch (error) {
          store.set({
            ...store.get(),
            loading: false,
            errorMessage: mapEntryError(error)
          })
        }
      },
      setTableContext(store, payload = {}) {
        const state = store.get()
        store.set({
          ...state,
          tableCode: payload.tableCode || state.tableCode,
          tableName: payload.tableName || state.tableName,
          dineMode: payload.dineMode || state.dineMode,
          tableStatus: payload.tableStatus || state.tableStatus,
          orderingSessionToken: payload.orderingSessionToken || state.orderingSessionToken,
          orderingCartId: payload.orderingCartId || state.orderingCartId,
          personSlot: payload.personSlot ?? state.personSlot,
          orderingLabel: payload.orderingLabel || state.orderingLabel,
          orderId: payload.orderId || state.orderId,
          orderNo: payload.orderNo || state.orderNo,
          orderStatus: payload.orderStatus || state.orderStatus,
          orderingEnabled: typeof payload.orderingEnabled === 'boolean'
            ? payload.orderingEnabled
            : state.orderingEnabled
        })
      }
    }
  })
}
