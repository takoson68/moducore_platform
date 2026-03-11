import world from '@/world.js'
import { buildCheckoutSummaryFromLocalCart } from '../cart/localCart.js'
import { mapCheckoutError, submitCheckoutOrder } from './service.js'

function createClientSubmissionId() {
  return `submit-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
}

function normalizePerson(person) {
  return {
    cartId: person.cartId,
    guestLabel: person.guestLabel,
    subtotal: Number(person.subtotal || 0),
    total: Number(person.total || 0),
    items: Array.isArray(person.items) ? person.items : []
  }
}

function buildSubmitItems(cartState) {
  const cartId = String(cartState.orderingCartId || '')
  const items = Array.isArray(cartState.cartItemsByCartId?.[cartId])
    ? cartState.cartItemsByCartId[cartId]
    : []

  return items.map(item => ({
    clientItemId: String(item.id || ''),
    menuItemId: String(item.menu_item_id || ''),
    quantity: Number(item.quantity || 0),
    note: String(item.note || ''),
    selectedOptionIds: Array.isArray(item.selected_option_ids) ? [...item.selected_option_ids] : []
  }))
}

export function createCheckoutStore() {
  return world.createStore({
    name: 'dineCoreCheckoutStore',
    defaultValue: {
      submitting: false,
      orderingSessionToken: '',
      errorMessage: '',
      currentBatchId: '',
      currentBatchNo: 0,
      currentBatchStatus: '',
      itemCount: 0,
      subtotal: 0,
      serviceFee: 0,
      tax: 0,
      total: 0,
      paymentStatus: 'unpaid',
      persons: []
    },
    actions: {
      load(store, input = {}) {
        const cartState = input?.cartState || {}
        const summary = buildCheckoutSummaryFromLocalCart(cartState)
        const orderingSessionToken =
          String(input?.orderingSessionToken || cartState.orderingSessionToken || '')

        store.set({
          ...store.get(),
          errorMessage: '',
          orderingSessionToken,
          currentBatchId: summary.currentBatchId || '',
          currentBatchNo: Number(summary.currentBatchNo || 0),
          currentBatchStatus: summary.currentBatchStatus || '',
          itemCount: Number(summary.itemCount || 0),
          subtotal: Number(summary.subtotal || 0),
          serviceFee: Number(summary.serviceFee || 0),
          tax: Number(summary.tax || 0),
          total: Number(summary.total || 0),
          persons: Array.isArray(summary.persons) ? summary.persons.map(normalizePerson) : []
        })
      },
      setSubmitting(store, submitting) {
        store.set({
          ...store.get(),
          submitting: Boolean(submitting)
        })
      },
      async submit(store, input) {
        const cartState = input?.cartState || {}
        const tableCode = input?.tableCode
        const orderingSessionToken = String(
          input?.orderingSessionToken || store.get().orderingSessionToken || ''
        )
        const clientSubmissionId = createClientSubmissionId()

        store.setSubmitting(true)
        try {
          const result = await submitCheckoutOrder({
            tableCode,
            orderingSessionToken,
            clientSubmissionId,
            cart: {
              orderingCartId: String(cartState.orderingCartId || ''),
              orderingLabel: String(cartState.orderingLabel || ''),
              personSlot: Number(cartState.personSlot || 0),
              items: buildSubmitItems(cartState)
            }
          })

          store.set({
            ...store.get(),
            errorMessage: '',
            currentBatchId: String(result.nextBatchId || ''),
            currentBatchNo: Number(result.nextBatchNo || 0),
            currentBatchStatus: 'draft',
            itemCount: 0,
            subtotal: 0,
            serviceFee: 0,
            tax: 0,
            total: 0,
            persons: []
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
