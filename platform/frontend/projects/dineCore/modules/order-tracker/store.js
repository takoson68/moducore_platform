import world from '@/world.js'
import { loadOrderTrackerPayload } from './service.js'

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
      orderNo: '',
      status: 'pending',
      estimatedWaitMinutes: null,
      persons: [],
      timeline: [],
      history: []
    },
    actions: {
      async load(store, orderId) {
        const payload = await loadOrderTrackerPayload(orderId)
        store.set({
          ...store.get(),
          orderNo: payload.order.orderNo,
          status: payload.order.status,
          estimatedWaitMinutes: payload.order.estimatedWaitMinutes,
          persons: Array.isArray(payload.persons) ? payload.persons.map(normalizePerson) : [],
          timeline: payload.timeline,
          history: payload.history
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
          timeline: Array.isArray(payload.timeline) ? payload.timeline : state.timeline,
          history: Array.isArray(payload.history) ? payload.history : state.history
        })
      }
    }
  })
}
