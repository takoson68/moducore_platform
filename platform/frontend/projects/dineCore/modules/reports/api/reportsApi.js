import { staffApiRequest } from '@project/api/staffApiRequest.js'

export async function loadReportsSummary(filters = {}) {
  return staffApiRequest('reports/summary', {
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
  return staffApiRequest('reports/orders', {
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
