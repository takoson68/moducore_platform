import { mockApiRequest } from '@project/api/mockRequest.js'

function translateCounterError(error) {
  const code = error instanceof Error ? error.message : String(error || '')

  switch (code) {
    case 'BUSINESS_DATE_LOCKED':
      return '這個營業日已關帳，無法再更新訂單或付款狀態。'
    case 'ORDER_NOT_FOUND':
      return '找不到指定訂單，請重新整理後再試。'
    default:
      return code || '櫃台操作失敗。'
  }
}

export async function loadCounterOrders(filters = {}) {
  try {
    return await mockApiRequest('counter/orders', { filters })
  } catch (error) {
    throw new Error(translateCounterError(error))
  }
}

export async function loadCounterOrderDetail(orderId) {
  try {
    return await mockApiRequest('counter/order-detail', { orderId })
  } catch (error) {
    throw new Error(translateCounterError(error))
  }
}

export async function updateCounterOrderStatus(orderId, orderStatus, note = '') {
  try {
    return await mockApiRequest('counter/update-order-status', { orderId, orderStatus, note })
  } catch (error) {
    throw new Error(translateCounterError(error))
  }
}

export async function updateCounterPaymentStatus(orderId, paymentStatus) {
  try {
    return await mockApiRequest('counter/update-payment-status', { orderId, paymentStatus })
  } catch (error) {
    throw new Error(translateCounterError(error))
  }
}
