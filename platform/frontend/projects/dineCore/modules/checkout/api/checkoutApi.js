import { dineCoreRequest } from '@project/api/dineCoreRequest.js'

export function submitCheckout({
  tableCode,
  orderingSessionToken = '',
  clientSubmissionId = '',
  cart = {}
}) {
  return dineCoreRequest('checkout/submit', {
    path: '/api/dinecore/checkout-submit',
    method: 'POST',
    mockPayload: {
      tableCode,
      orderingSessionToken,
      clientSubmissionId,
      cart
    },
    body: {
      table_code: tableCode,
      ordering_session_token: orderingSessionToken,
      client_submission_id: clientSubmissionId,
      ordering_cart_id: cart.orderingCartId || '',
      ordering_label: cart.orderingLabel || '',
      person_slot: cart.personSlot || 0,
      items: Array.isArray(cart.items) ? cart.items : []
    }
  })
}

export function getCheckoutSuccess(tableCode, orderId, submittedBatchNo = 0, orderingSessionToken = '') {
  return dineCoreRequest('checkout/success', {
    path: '/api/dinecore/checkout-success',
    method: 'GET',
    mockPayload: {
      tableCode,
      orderId,
      submittedBatchNo,
      orderingSessionToken
    },
    query: {
      table_code: tableCode,
      order_id: orderId,
      submitted_batch_no: submittedBatchNo || '',
      ordering_session_token: orderingSessionToken
    }
  })
}
