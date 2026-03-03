import { mockApiRequest } from '@project/api/mockRequest.js'

export async function loadOrderTrackerPayload(orderId) {
  return mockApiRequest('order-tracker/get', { orderId })
}
