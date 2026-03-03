import { getOrderTracker } from './api/orderTrackerApi.js'

export async function loadOrderTrackerPayload(orderId, orderingSessionToken = '') {
  return getOrderTracker(orderId, orderingSessionToken)
}

export function mapOrderTrackerError(error) {
  const code = String(error?.message || '')

  switch (code) {
    case 'ORDER_NOT_FOUND':
      return '找不到這張訂單，可能已結束或尚未建立。'
    default:
      return '目前無法同步訂單狀態，請稍後再試。'
  }
}
