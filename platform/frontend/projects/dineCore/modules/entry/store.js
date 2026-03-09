import world from '@/world.js'
import {
  getGuestOrderingSessionToken,
  setGuestOrderingSessionToken
} from '@project/api/guestOrderingSession.js'
import { loadEntryContext, mapEntryError, shouldRetryEntryContext } from './service.js'

function applyEntryPayload(store, tableCode, payload) {
  setGuestOrderingSessionToken(payload.code || tableCode, payload.ordering_session_token || '')
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
    orderStatus: payload.order_status || '',
    currentBatchId: payload.current_batch_id || '',
    currentBatchNo: Number(payload.current_batch_no || 0),
    currentBatchStatus: payload.current_batch_status || ''
  })
}

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
      orderStatus: '',
      currentBatchId: '',
      currentBatchNo: 0,
      currentBatchStatus: ''
    },
    actions: {
      setLoading(store, loading) {
        store.set({
          ...store.get(),
          loading: Boolean(loading)
        })
      },
      async loadTableContext(store, input) {
        const tableCode = String(typeof input === 'string' ? input : input?.tableCode || '')
          .trim()
          .toUpperCase()
        if (!tableCode) {
          store.set({
            ...store.get(),
            loading: false,
            errorMessage: mapEntryError(new Error('TABLE_CODE_REQUIRED'))
          })
          return
        }

        const requestedOrderingSessionToken =
          typeof input === 'string' ? '' : String(input?.orderingSessionToken || '')
        const orderingSessionToken =
          requestedOrderingSessionToken || getGuestOrderingSessionToken(tableCode)
        store.setLoading(true)

        try {
          const payload = await loadEntryContext(tableCode, orderingSessionToken)
          applyEntryPayload(store, tableCode, payload)
        } catch (error) {
          if (orderingSessionToken && shouldRetryEntryContext(error)) {
            try {
              setGuestOrderingSessionToken(tableCode, '')
              const payload = await loadEntryContext(tableCode, '')
              applyEntryPayload(store, tableCode, payload)
              return
            } catch (retryError) {
              error = retryError
            }
          }

          store.set({
            ...store.get(),
            loading: false,
            errorMessage: mapEntryError(error)
          })
        }
      },
      setTableContext(store, payload = {}) {
        const state = store.get()
        const nextTableCode = payload.tableCode || state.tableCode
        const nextOrderingSessionToken = payload.orderingSessionToken || state.orderingSessionToken

        setGuestOrderingSessionToken(nextTableCode, nextOrderingSessionToken)

        store.set({
          ...state,
          tableCode: nextTableCode,
          tableName: payload.tableName || state.tableName,
          dineMode: payload.dineMode || state.dineMode,
          tableStatus: payload.tableStatus || state.tableStatus,
          orderingSessionToken: nextOrderingSessionToken,
          orderingCartId: payload.orderingCartId || state.orderingCartId,
          personSlot: payload.personSlot ?? state.personSlot,
          orderingLabel: payload.orderingLabel || state.orderingLabel,
          orderId: payload.orderId || state.orderId,
          orderNo: payload.orderNo || state.orderNo,
          orderStatus: payload.orderStatus || state.orderStatus,
          currentBatchId: payload.currentBatchId || state.currentBatchId,
          currentBatchNo: payload.currentBatchNo ?? state.currentBatchNo,
          currentBatchStatus: payload.currentBatchStatus || state.currentBatchStatus,
          orderingEnabled: typeof payload.orderingEnabled === 'boolean'
            ? payload.orderingEnabled
            : state.orderingEnabled
        })
      }
    }
  })
}
