import { dineCoreRequest } from '@project/api/dineCoreRequest.js'

export function getOrderTracker(orderId, orderingSessionToken = '') {
  return dineCoreRequest('order-tracker/get', {
    path: '/api/dinecore/order-tracker',
    method: 'GET',
    mockPayload: {
      orderId,
      orderingSessionToken
    },
    query: {
      order_id: orderId,
      ordering_session_token: orderingSessionToken
    }
  })
}
