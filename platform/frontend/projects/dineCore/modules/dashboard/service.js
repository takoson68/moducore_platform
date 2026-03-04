import { staffApiRequest } from '@project/api/staffApiRequest.js'

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

export async function loadDashboardSummary() {
  const [reportsSummary, counterOrders, kitchenOrders] = await Promise.all([
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
    }),
    staffApiRequest('counter/orders', {
      path: '/api/dinecore/staff/counter/orders',
      method: 'GET'
    }),
    staffApiRequest('kitchen/orders', {
      path: '/api/dinecore/staff/kitchen/orders',
      method: 'GET'
    })
  ])

  const summary = reportsSummary.summary || {}
  const recentOrders = normalizeRecentOrders(counterOrders)
  const actionableBatches = Array.isArray(kitchenOrders) ? kitchenOrders : []

  return {
    businessDate: summary.businessDate || '',
    dailyOrderCount: Number(summary.orderCount || 0),
    dailyRevenueTotal: Number(summary.grossSales || 0),
    paidAmount: Number(summary.paidAmount || 0),
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
    recentOrders
  }
}
