import { dineCoreRequest } from '@project/api/dineCoreRequest.js'

export async function loadReportsSummary(filters = {}) {
  return dineCoreRequest('reports/summary', {
    path: '/api/dinecore/staff/reports/summary',
    method: 'GET',
    mockPayload: { filters },
    query: {
      date_from: filters.dateFrom || '',
      date_to: filters.dateTo || '',
      status: filters.status || 'all',
      payment_status: filters.paymentStatus || 'all',
      payment_method: filters.paymentMethod || 'all',
      keyword: filters.keyword || ''
    }
  })
}

export async function loadReportOrders(filters = {}) {
  return dineCoreRequest('reports/orders', {
    path: '/api/dinecore/staff/reports/orders',
    method: 'GET',
    mockPayload: { filters },
    query: {
      date_from: filters.dateFrom || '',
      date_to: filters.dateTo || '',
      status: filters.status || 'all',
      payment_status: filters.paymentStatus || 'all',
      payment_method: filters.paymentMethod || 'all',
      keyword: filters.keyword || ''
    }
  })
}
