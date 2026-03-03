import { mockApiRequest } from '@project/api/mockRequest.js'

function translateKitchenError(error) {
  const code = error instanceof Error ? error.message : String(error || '')

  switch (code) {
    case 'BUSINESS_DATE_LOCKED':
      return '這個營業日已關帳，廚房不可再更新出餐狀態。'
    case 'ORDER_NOT_FOUND':
      return '找不到指定訂單，請重新整理後再試。'
    default:
      return code || '廚房操作失敗。'
  }
}

export async function loadKitchenOrders() {
  try {
    return await mockApiRequest('kitchen/orders')
  } catch (error) {
    throw new Error(translateKitchenError(error))
  }
}

export async function updateKitchenOrderStatus(orderId, orderStatus) {
  try {
    return await mockApiRequest('kitchen/update-order-status', { orderId, orderStatus })
  } catch (error) {
    throw new Error(translateKitchenError(error))
  }
}
