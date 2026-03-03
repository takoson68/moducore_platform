import world from '@/world.js'
import {
  loadCheckoutSummary,
  mapCheckoutError,
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
      orderingSessionToken: '',
      errorMessage: '',
      subtotal: 0,
      serviceFee: 0,
      tax: 0,
      total: 0,
      paymentStatus: 'unpaid',
      persons: []
    },
    actions: {
      async load(store, input) {
        const tableCode = typeof input === 'string' ? input : input?.tableCode
        const orderingSessionToken =
          typeof input === 'string' ? '' : String(input?.orderingSessionToken || '')
        try {
          const payload = await loadCheckoutSummary(tableCode, orderingSessionToken)
          store.set({
            ...store.get(),
            errorMessage: '',
            orderingSessionToken: orderingSessionToken || store.get().orderingSessionToken,
            subtotal: Number(payload.subtotal || 0),
            serviceFee: Number(payload.serviceFee || 0),
            tax: Number(payload.tax || 0),
            total: Number(payload.total || 0),
            persons: Array.isArray(payload.persons) ? payload.persons.map(normalizePerson) : []
          })
        } catch (error) {
          store.set({
            ...store.get(),
            errorMessage: mapCheckoutError(error)
          })
        }
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
      async submit(store, input) {
        const tableCode = typeof input === 'string' ? input : input?.tableCode
        const orderingSessionToken =
          typeof input === 'string'
            ? store.get().orderingSessionToken
            : String(input?.orderingSessionToken || store.get().orderingSessionToken || '')
        store.setSubmitting(true)
        try {
          const result = await submitCheckoutOrder(tableCode, orderingSessionToken)
          store.set({
            ...store.get(),
            errorMessage: ''
          })
          return result
        } catch (error) {
          store.set({
            ...store.get(),
            errorMessage: mapCheckoutError(error)
          })
          throw error
        } finally {
          store.setSubmitting(false)
        }
      }
    }
  })
}
