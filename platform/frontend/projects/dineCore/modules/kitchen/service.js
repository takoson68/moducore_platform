import { staffApiRequest } from '@project/api/staffApiRequest.js'

function translateKitchenError(error) {
  const code = error instanceof Error ? error.message : String(error || '')

  switch (code) {
    case 'STAFF_SESSION_REQUIRED':
      return '請先登入員工帳號再查看廚房看板。'
    case 'STAFF_ROLE_FORBIDDEN':
      return '目前帳號沒有廚房作業權限。'
    case 'BUSINESS_DATE_LOCKED':
      return '當前營業日已關帳，無法再調整廚房訂單狀態。'
    case 'ORDER_NOT_FOUND':
      return '找不到指定批次。'
    default:
      return code || '廚房看板資料載入失敗。'
  }
}

export async function loadKitchenOrders() {
  try {
    const orders = await staffApiRequest('kitchen/orders', {
      path: '/api/dinecore/staff/kitchen/orders',
      method: 'GET'
    })

    return Array.isArray(orders)
      ? orders.filter(order =>
          order &&
          String(order.id || '').trim() !== '' &&
          String(order.orderNo || '').trim() !== '' &&
          String(order.tableCode || '').trim() !== ''
        )
      : []
  } catch (error) {
    throw new Error(translateKitchenError(error))
  }
}

export async function updateKitchenOrderStatus(batchId, orderStatus) {
  try {
    return await staffApiRequest('kitchen/update-order-status', {
      path: '/api/dinecore/staff/kitchen/update-order-status',
      method: 'POST',
      body: { batchId, orderStatus },
      mockPayload: { orderId: batchId, orderStatus }
    })
  } catch (error) {
    throw new Error(translateKitchenError(error))
  }
}
