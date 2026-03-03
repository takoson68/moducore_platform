import world from '@/world.js'
import {
  loadCheckoutSummary,
  submitCheckoutOrder
} from './service.js'

function normalizePerson(person) {
  return {
    cartId: person.cartId,
    guestLabel: person.guestLabel,
    subtotal: Number(person.subtotal || 0),
    total: Number(person.total || 0),
    items: Array.isArray(person.items) ? person.items : []
  }
}

export function createCheckoutStore() {
  return world.createStore({
    name: 'dineCoreCheckoutStore',
    defaultValue: {
      submitting: false,
      subtotal: 0,
      serviceFee: 0,
      tax: 0,
      total: 0,
      paymentStatus: 'unpaid',
      persons: []
    },
    actions: {
      async load(store, tableCode) {
        const payload = await loadCheckoutSummary(tableCode)
        store.set({
          ...store.get(),
          subtotal: Number(payload.subtotal || 0),
          serviceFee: Number(payload.serviceFee || 0),
          tax: Number(payload.tax || 0),
          total: Number(payload.total || 0),
          persons: Array.isArray(payload.persons) ? payload.persons.map(normalizePerson) : []
        })
      },
      setSummary(store, payload = {}) {
        const state = store.get()
        store.set({
          ...state,
          subtotal: payload.subtotal ?? state.subtotal,
          serviceFee: payload.serviceFee ?? state.serviceFee,
          tax: payload.tax ?? state.tax,
          total: payload.total ?? state.total,
          paymentStatus: payload.paymentStatus || state.paymentStatus,
          persons: Array.isArray(payload.persons) ? payload.persons.map(normalizePerson) : state.persons
        })
      },
      setSubmitting(store, submitting) {
        store.set({
          ...store.get(),
          submitting: Boolean(submitting)
        })
      },
      async submit(store, tableCode) {
        store.setSubmitting(true)
        try {
          return await submitCheckoutOrder(tableCode)
        } finally {
          store.setSubmitting(false)
        }
      }
    }
  })
}
