import { staffApiRequest } from '@project/api/staffApiRequest.js'

function translateCounterError(error) {
  const code = error instanceof Error ? error.message : String(error || '')

  switch (code) {
    case 'STAFF_SESSION_REQUIRED':
      return '請先登入員工帳號再查看櫃台資料。'
    case 'STAFF_ROLE_FORBIDDEN':
      return '目前帳號沒有櫃台作業權限。'
    case 'BUSINESS_DATE_LOCKED':
      return '當前營業日已關帳，無法再調整訂單。'
    case 'ORDER_NOT_FOUND':
      return '找不到指定訂單。'
    default:
      return code || '櫃台訂單資料載入失敗。'
  }
}

export async function loadCounterTables() {
  try {
    const tables = await staffApiRequest('staff/tables', {
      path: '/api/dinecore/staff/tables',
      method: 'GET'
    })

    return Array.isArray(tables)
      ? tables.filter(table => table && String(table.code || '').trim() !== '')
      : []
  } catch (error) {
    throw new Error(translateCounterError(error))
  }
}

export async function loadCounterOrders(filters = {}) {
  try {
    const orders = await staffApiRequest('counter/orders', {
      path: '/api/dinecore/staff/counter/orders',
      method: 'GET',
      query: {
        table_code: filters.tableCode || '',
        order_no: filters.orderNo || '',
        order_status: filters.orderStatus || 'all',
        payment_status: filters.paymentStatus || 'all'
      },
      mockPayload: { filters }
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
    throw new Error(translateCounterError(error))
  }
}

export async function loadCounterOrderDetail(orderId) {
  try {
    return await staffApiRequest('counter/order-detail', {
      path: '/api/dinecore/staff/counter/order-detail',
      method: 'GET',
      query: { order_id: orderId },
      mockPayload: { orderId }
    })
  } catch (error) {
    throw new Error(translateCounterError(error))
  }
}

export async function updateCounterOrderStatus(orderId, orderStatus, note = '') {
  try {
    return await staffApiRequest('counter/update-order-status', {
      path: '/api/dinecore/staff/counter/update-order-status',
      method: 'POST',
      body: { orderId, orderStatus, note },
      mockPayload: { orderId, orderStatus, note }
    })
  } catch (error) {
    throw new Error(translateCounterError(error))
  }
}

export async function updateCounterPaymentStatus(orderId, paymentStatus) {
  try {
    return await staffApiRequest('counter/update-payment-status', {
      path: '/api/dinecore/staff/counter/update-payment-status',
      method: 'POST',
      body: { orderId, paymentStatus },
      mockPayload: { orderId, paymentStatus }
    })
  } catch (error) {
    throw new Error(translateCounterError(error))
  }
}
