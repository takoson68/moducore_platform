import world from '@/world.js'
import { loadOrderTrackerPayload, mapOrderTrackerError } from './service.js'

function normalizePerson(person) {
  return {
    cartId: person.cartId,
    guestLabel: person.guestLabel,
    subtotal: Number(person.subtotal || 0),
    total: Number(person.total || 0),
    items: Array.isArray(person.items) ? person.items : []
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
      timeline: [],
      history: []
    },
    actions: {
      async load(store, { orderId, orderingSessionToken = '' }) {
        try {
          const payload = await loadOrderTrackerPayload(orderId, orderingSessionToken)
          store.set({
            ...store.get(),
            errorMessage: '',
            orderNo: payload.order.orderNo,
            status: payload.order.status,
            estimatedWaitMinutes: payload.order.estimatedWaitMinutes,
            persons: Array.isArray(payload.persons) ? payload.persons.map(normalizePerson) : [],
            timeline: payload.timeline,
            history: payload.history
          })
        } catch (error) {
          store.set({
            ...store.get(),
            errorMessage: mapOrderTrackerError(error)
          })
        }
      },
      setOrderSnapshot(store, payload = {}) {
        const state = store.get()
        store.set({
          ...state,
          orderNo: payload.orderNo || state.orderNo,
          status: payload.status || state.status,
          estimatedWaitMinutes: payload.estimatedWaitMinutes ?? state.estimatedWaitMinutes,
          persons: Array.isArray(payload.persons) ? payload.persons.map(normalizePerson) : state.persons,
          timeline: Array.isArray(payload.timeline) ? payload.timeline : state.timeline,
          history: Array.isArray(payload.history) ? payload.history : state.history
        })
      }
    }
  })
}
