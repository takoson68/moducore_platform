import { mockApiRequest } from '@project/api/mockRequest.js'

export async function loadKitchenOrders() {
  return mockApiRequest('kitchen/orders')
}

export async function updateKitchenOrderStatus(orderId, orderStatus) {
  return mockApiRequest('kitchen/update-order-status', { orderId, orderStatus })
}
