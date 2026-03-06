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
