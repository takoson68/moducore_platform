import { dineCoreRequest } from '@project/api/dineCoreRequest.js'

export function getCheckoutSummary(tableCode, orderingSessionToken = '') {
  return dineCoreRequest('checkout/summary', {
    path: '/api/dinecore/checkout-summary',
    method: 'GET',
    mockPayload: {
      tableCode,
      orderingSessionToken
    },
    query: {
      table_code: tableCode,
      ordering_session_token: orderingSessionToken
    }
  })
}

export function submitCheckout(tableCode, orderingSessionToken = '') {
  return dineCoreRequest('checkout/submit', {
    path: '/api/dinecore/checkout-submit',
    method: 'POST',
    mockPayload: {
      tableCode,
      orderingSessionToken
    },
    body: {
      table_code: tableCode,
      ordering_session_token: orderingSessionToken
    }
  })
}

export function getCheckoutSuccess(orderId) {
  return dineCoreRequest('checkout/success', {
    path: '/api/dinecore/checkout-success',
    method: 'GET',
    mockPayload: {
      orderId
    },
    query: {
      order_id: orderId
    }
  })
}
