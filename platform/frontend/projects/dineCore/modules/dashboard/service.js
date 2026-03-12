import { staffApiRequest } from '@project/api/staffApiRequest.js'

function translateDashboardError(error) {
  const code = error instanceof Error ? error.message : String(error || '')

  switch (code) {
    case 'STAFF_SESSION_REQUIRED':
      return '尚未取得員工登入狀態，請重新登入後再試。'
    case 'STAFF_ROLE_FORBIDDEN':
      return '目前角色無法查看營運儀表板。'
    default:
      return code || '儀表板資料載入失敗。'
  }
}

function normalizeBreakdown(payload = {}, defaults = {}) {
  return {
    ...defaults,
    ...Object.fromEntries(
      Object.entries(payload || {}).map(([key, value]) => [key, Number(value || 0)])
    )
  }
}

function normalizeRecentOrders(orders = []) {
  return Array.isArray(orders)
    ? orders.slice(0, 6).map(order => ({
        id: Number(order.id || 0),
        orderNo: order.orderNo || '',
        tableCode: order.tableCode || '',
        orderStatus: order.orderStatus || '',
        paymentStatus: order.paymentStatus || '',
        totalAmount: Number(order.totalAmount || 0),
        guestCount: Number(order.guestCount || 0),
        batchCount: Number(order.batchCount || 0),
        latestBatchNo: Number(order.latestBatchNo || 0),
        latestBatchStatus: order.latestBatchStatus || '',
        createdAt: order.createdAt || ''
      }))
    : []
}

function normalizeTopItems(items = []) {
  return Array.isArray(items)
    ? items.map(item => ({
        itemId: item.itemId || '',
        itemName: item.itemName || '',
        quantity: Number(item.quantity || 0),
        grossSales: Number(item.grossSales || 0)
      }))
    : []
}

async function settleDashboardSection(label, task) {
  try {
    return {
      ok: true,
      label,
      data: await task()
    }
  } catch (error) {
    return {
      ok: false,
      label,
      error: error instanceof Error ? error : new Error(String(error || 'API_ERROR'))
    }
  }
}

function buildDashboardWarnings(results = []) {
  return results
    .filter(result => !result.ok)
    .map(result => `${result.label} 暫時無法載入`)
}

export async function loadDashboardSummary() {
  const [reportsResult, counterResult, kitchenResult] = await Promise.all([
    settleDashboardSection('營收摘要', () =>
      staffApiRequest('reports/summary', {
        path: '/api/dinecore/staff/reports/summary',
        method: 'GET',
        query: {
          date_from: '',
          date_to: '',
          status: 'all',
          payment_status: 'all',
          payment_method: 'all',
          keyword: ''
        }
      })
    ),
    settleDashboardSection('最新訂單', () =>
      staffApiRequest('counter/orders', {
        path: '/api/dinecore/staff/counter/orders',
        method: 'GET'
      })
    ),
    settleDashboardSection('廚房批次', () =>
      staffApiRequest('kitchen/orders', {
        path: '/api/dinecore/staff/kitchen/orders',
        method: 'GET'
      })
    )
  ])

  const results = [reportsResult, counterResult, kitchenResult]
  const firstFailure = results.find(result => !result.ok)
  const hasSuccess = results.some(result => result.ok)

  if (!hasSuccess && firstFailure) {
    throw new Error(translateDashboardError(firstFailure.error))
  }

  const reportsSummary = reportsResult.ok ? reportsResult.data : {}
  const summary = reportsSummary.summary || {}
  const recentOrders = normalizeRecentOrders(counterResult.ok ? counterResult.data : [])
  const actionableBatches = Array.isArray(kitchenResult.ok ? kitchenResult.data : null)
    ? kitchenResult.data
    : []

  return {
    businessDate: summary.businessDate || '',
    paidAmount: Number(summary.paidAmount || 0),
    dailyOrderCount: Number(summary.orderCount || 0),
    dailyRevenueTotal: Number(summary.paidAmount || 0),
    dailyOrderGrossTotal: Number(summary.grossSales || 0),
    unpaidAmount: Number(summary.unpaidAmount || 0),
    completedOrderCount: Number(summary.completedOrderCount || 0),
    cancelledOrderCount: Number(summary.cancelledOrderCount || 0),
    averageOrderValue: Number(summary.averageOrderValue || 0),
    orderStatusBreakdown: normalizeBreakdown(reportsSummary.statusBreakdown, {
      pending: 0,
      preparing: 0,
      ready: 0,
      picked_up: 0,
      cancelled: 0
    }),
    paymentMethodBreakdown: normalizeBreakdown(reportsSummary.paymentBreakdown, {
      cash: 0,
      counter_card: 0,
      other: 0,
      unpaid: 0
    }),
    batchSnapshot: {
      activeBatchCount: actionableBatches.length,
      submittedCount: actionableBatches.filter(item => item.orderStatus === 'submitted' || item.orderStatus === 'pending').length,
      preparingCount: actionableBatches.filter(item => item.orderStatus === 'preparing').length,
      readyCount: actionableBatches.filter(item => item.orderStatus === 'ready').length,
      draftOrderCount: recentOrders.filter(item => item.latestBatchStatus === 'draft').length,
      unpaidOrderCount: recentOrders.filter(item => item.paymentStatus !== 'paid').length
    },
    topSellingItems: normalizeTopItems(reportsSummary.topItems),
    recentOrders,
    warnings: buildDashboardWarnings(results)
  }
}
