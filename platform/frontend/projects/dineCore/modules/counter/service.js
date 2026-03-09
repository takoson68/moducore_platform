import { staffApiRequest } from '@project/api/staffApiRequest.js'

function normalizePaymentStatus(value) {
  const status = String(value || '').trim().toLowerCase()
  return status === 'paid' ? 'paid' : 'unpaid'
}

function normalizeOrderRow(order) {
  return {
    ...order,
    paymentStatus: normalizePaymentStatus(order?.paymentStatus)
  }
}

function translateCounterError(error) {
  const code = error instanceof Error ? error.message : String(error || '')

  switch (code) {
    case 'STAFF_SESSION_REQUIRED':
      return '請先登入員工帳號。'
    case 'STAFF_ROLE_FORBIDDEN':
      return '目前帳號沒有櫃台權限。'
    case 'BUSINESS_DATE_LOCKED':
      return '該營業日已關帳，無法再修改訂單。'
    case 'ORDER_NOT_FOUND':
      return '找不到指定訂單。'
    case 'MERGE_TABLE_MISMATCH':
      return '只能併入同桌的訂單。'
    case 'MERGE_DATE_MISMATCH':
      return '只能併入同營業日的訂單。'
    case 'MERGE_ORDER_PAID':
      return '已付款訂單不可再併單。'
    case 'MERGE_ORDER_INVALID_STATUS':
      return '目前訂單狀態不可併單。'
    default:
      return code || '櫃台訂單操作失敗。'
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
      ? orders
          .filter(order =>
            order &&
            String(order.id || '').trim() !== '' &&
            String(order.orderNo || '').trim() !== '' &&
            String(order.tableCode || '').trim() !== ''
          )
          .map(normalizeOrderRow)
      : []
  } catch (error) {
    throw new Error(translateCounterError(error))
  }
}

export async function loadCounterOrderDetail(orderId) {
  try {
    const detail = await staffApiRequest('counter/order-detail', {
      path: '/api/dinecore/staff/counter/order-detail',
      method: 'GET',
      query: { order_id: orderId },
      mockPayload: { orderId }
    })

    if (!detail || typeof detail !== 'object') {
      return detail
    }

    return {
      ...detail,
      order: {
        ...(detail.order || {}),
        paymentStatus: normalizePaymentStatus(detail?.order?.paymentStatus)
      }
    }
  } catch (error) {
    throw new Error(translateCounterError(error))
  }
}

export async function loadCounterMergeCandidates(orderId) {
  try {
    const payload = await staffApiRequest('counter/merge-candidates', {
      path: '/api/dinecore/staff/counter/merge-candidates',
      method: 'GET',
      query: { order_id: orderId },
      mockPayload: { orderId }
    })

    return Array.isArray(payload?.candidates) ? payload.candidates : []
  } catch (error) {
    throw new Error(translateCounterError(error))
  }
}

export async function mergeCounterOrders(targetOrderId, mergedOrderId, reason = '') {
  try {
    return await staffApiRequest('counter/merge-orders', {
      path: '/api/dinecore/staff/counter/merge-orders',
      method: 'POST',
      body: { targetOrderId, mergedOrderId, reason },
      mockPayload: { targetOrderId, mergedOrderId, reason }
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

