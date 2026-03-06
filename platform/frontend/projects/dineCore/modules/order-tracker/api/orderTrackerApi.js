import { dineCoreRequest } from '@project/api/dineCoreRequest.js'

export function getOrderTracker(tableCode, orderId, orderingSessionToken = '') {
  return dineCoreRequest('order-tracker/get', {
    path: '/api/dinecore/order-tracker',
    method: 'GET',
    mockPayload: {
      tableCode,
      orderId,
      orderingSessionToken
    },
    query: {
      table_code: tableCode,
      order_id: orderId,
      ordering_session_token: orderingSessionToken
    }
  })
}
