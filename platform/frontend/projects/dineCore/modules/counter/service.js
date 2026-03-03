import { mockApiRequest } from '@project/api/mockRequest.js'

export async function loadCounterOrders(filters = {}) {
  return mockApiRequest('counter/orders', { filters })
}

export async function loadCounterOrderDetail(orderId) {
  return mockApiRequest('counter/order-detail', { orderId })
}

export async function updateCounterOrderStatus(orderId, orderStatus, note = '') {
  return mockApiRequest('counter/update-order-status', { orderId, orderStatus, note })
}

export async function updateCounterPaymentStatus(orderId, paymentStatus) {
  return mockApiRequest('counter/update-payment-status', { orderId, paymentStatus })
}
