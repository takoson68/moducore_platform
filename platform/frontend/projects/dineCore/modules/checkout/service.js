import { mockApiRequest } from '@project/api/mockRequest.js'

export async function loadCheckoutSummary(tableCode) {
  return mockApiRequest('checkout/summary', { tableCode })
}

export async function submitCheckoutOrder(tableCode) {
  return mockApiRequest('checkout/submit', { tableCode })
}

export async function loadCheckoutSuccessSummary(orderId) {
  return mockApiRequest('checkout/success', { orderId })
}
