import world from '@/world.js'
import { loadOrderTrackerPayload, mapOrderTrackerError } from './service.js'
import { loadCheckoutSuccessSummary } from '../checkout/service.js'

function normalizePerson(person) {
  return {
    cartId: person.cartId,
    guestLabel: person.guestLabel,
    subtotal: Number(person.subtotal || 0),
    serviceFee: Number(person.serviceFee || 0),
    tax: Number(person.tax || 0),
    total: Number(person.total || 0),
    items: Array.isArray(person.items) ? person.items : []
  }
}

function normalizeBatch(batch) {
  return {
    id: Number(batch.id || 0),
    batchNo: Number(batch.batchNo || 0),
    status: batch.status || 'draft',
    sourceSessionToken: batch.sourceSessionToken || '',
    submittedAt: batch.submittedAt || null,
    lockedAt: batch.lockedAt || null,
    itemCount: Number(batch.itemCount || 0),
    subtotal: Number(batch.subtotal || 0),
    persons: Array.isArray(batch.persons) ? batch.persons.map(normalizePerson) : []
  }
}

export function createOrderTrackerStore() {
  return world.createStore({
    name: 'dineCoreOrderTrackerStore',
    defaultValue: {
      errorMessage: '',
      orderNo: '',
      status: 'pending',
      estimatedWaitMinutes: null,
      persons: [],
      batches: []
    },
    actions: {
      async load(store, { tableCode, orderId, orderingSessionToken = '' }) {
        let apiError = null

        try {
          const payload = await loadOrderTrackerPayload(tableCode, orderId, orderingSessionToken)
          store.set({
            ...store.get(),
            errorMessage: '',
            orderNo: payload.order.orderNo,
            status: payload.order.status,
            estimatedWaitMinutes: payload.order.estimatedWaitMinutes,
            persons: Array.isArray(payload.persons) ? payload.persons.map(normalizePerson) : [],
            batches: Array.isArray(payload.batches) ? payload.batches.map(normalizeBatch) : []
          })
          return
        } catch (error) {
          apiError = error
        }

        // Fallback: if tracker endpoint fails, still show latest submitted data.
        try {
          const fallback = await loadCheckoutSuccessSummary(
            tableCode,
            orderId,
            0,
            orderingSessionToken
          )
          store.set({
            ...store.get(),
            errorMessage: '',
            orderNo: String(fallback.orderNo || ''),
            status: String(fallback.status || 'pending'),
            estimatedWaitMinutes: fallback.estimatedWaitMinutes ?? null,
            persons: Array.isArray(fallback.persons) ? fallback.persons.map(normalizePerson) : [],
            batches: Array.isArray(fallback.batches) ? fallback.batches.map(normalizeBatch) : []
          })
          return
        } catch (fallbackError) {
          void fallbackError
        }

        store.set({
          ...store.get(),
          errorMessage: mapOrderTrackerError(apiError)
        })
      },
      setErrorMessage(store, message = '') {
        store.set({
          ...store.get(),
          errorMessage: String(message || '')
        })
      },
      clearError(store) {
        store.set({
          ...store.get(),
          errorMessage: ''
        })
      },
      setOrderSnapshot(store, payload = {}) {
        const state = store.get()
        store.set({
          ...state,
          orderNo: payload.orderNo || state.orderNo,
          status: payload.status || state.status,
          estimatedWaitMinutes: payload.estimatedWaitMinutes ?? state.estimatedWaitMinutes,
          persons: Array.isArray(payload.persons) ? payload.persons.map(normalizePerson) : state.persons,
          batches: Array.isArray(payload.batches) ? payload.batches.map(normalizeBatch) : state.batches
        })
      }
    }
  })
}
