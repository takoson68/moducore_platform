import { loadReportOrders, loadReportsSummary } from './api/reportsApi.js'

const reportStatusLabels = {
  pending: '待處理',
  preparing: '製作中',
  ready: '可取餐',
  picked_up: '已取餐',
  cancelled: '已取消'
}

const reportPaymentStatusLabels = {
  unpaid: '未付款',
  paid: '已付款'
}

const reportPaymentMethodLabels = {
  cash: '現金',
  counter_card: '櫃台刷卡',
  other: '其他',
  unpaid: '未付款',
  all: '全部'
}

function translateReportsError(error) {
  const code = error instanceof Error ? error.message : String(error || '')

  switch (code) {
    case 'STAFF_SESSION_REQUIRED':
      return '尚未取得員工登入狀態，請重新登入後再試。'
    case 'STAFF_ROLE_FORBIDDEN':
      return '目前角色無法查看營運報表。'
    default:
      return code || '營運報表載入失敗。'
  }
}

function normalizeSummary(payload = {}) {
  return {
    businessDate: payload.businessDate || '',
    grossSales: Number(payload.grossSales || 0),
    paidAmount: Number(payload.paidAmount || 0),
    unpaidAmount: Number(payload.unpaidAmount || 0),
    orderCount: Number(payload.orderCount || 0),
    completedOrderCount: Number(payload.completedOrderCount || 0),
    cancelledOrderCount: Number(payload.cancelledOrderCount || 0),
    averageOrderValue: Number(payload.averageOrderValue || 0)
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

export async function loadReportsSnapshot(filters = {}) {
  try {
    const [summary, orders] = await Promise.all([
      loadReportsSummary(filters),
      loadReportOrders(filters)
    ])

    return {
      summary: normalizeSummary(summary.summary),
      statusBreakdown: normalizeBreakdown(summary.statusBreakdown, {
        pending: 0,
        preparing: 0,
        ready: 0,
        picked_up: 0,
        cancelled: 0
      }),
      paymentBreakdown: normalizeBreakdown(summary.paymentBreakdown, {
        cash: 0,
        counter_card: 0,
        other: 0,
        unpaid: 0
      }),
      topItems: Array.isArray(summary.topItems) ? summary.topItems : [],
      orderRows: Array.isArray(orders.orders) ? orders.orders : []
    }
  } catch (error) {
    throw new Error(translateReportsError(error))
  }
}

function escapeCsvValue(value) {
  const safeValue = String(value ?? '')
  if (safeValue.includes('"') || safeValue.includes(',') || safeValue.includes('\n')) {
    return `"${safeValue.replaceAll('"', '""')}"`
  }

  return safeValue
}

function normalizeFilterLabel(key, value) {
  if (!value) return '未設定'

  switch (key) {
    case 'status':
      return value === 'all' ? '全部' : (reportStatusLabels[value] || value)
    case 'paymentStatus':
      return value === 'all' ? '全部' : (reportPaymentStatusLabels[value] || value)
    case 'paymentMethod':
      return reportPaymentMethodLabels[value] || value
    default:
      return value
  }
}

export function buildReportsCsv({ orderRows = [], summary = {}, filters = {} } = {}) {
  const metaRows = [
    ['報表名稱', 'DineCore 營運報表匯出'],
    ['營運日期', summary.businessDate || '未設定'],
    ['起始日期', normalizeFilterLabel('dateFrom', filters.dateFrom || '')],
    ['結束日期', normalizeFilterLabel('dateTo', filters.dateTo || '')],
    ['訂單狀態', normalizeFilterLabel('status', filters.status || 'all')],
    ['付款狀態', normalizeFilterLabel('paymentStatus', filters.paymentStatus || 'all')],
    ['付款方式', normalizeFilterLabel('paymentMethod', filters.paymentMethod || 'all')],
    ['關鍵字', normalizeFilterLabel('keyword', filters.keyword || '')],
    ['今日營收', summary.paidAmount ?? 0],
    ['訂單總額', summary.grossSales ?? 0],
    ['未付款金額', summary.unpaidAmount ?? 0],
    ['訂單數', summary.orderCount ?? 0],
    ['平均客單價', summary.averageOrderValue ?? 0],
    []
  ]

  const header = [
    '訂單編號',
    '桌號',
    '建立時間',
    '訂單狀態',
    '付款狀態',
    '付款方式',
    '訂單金額',
    '品項數',
    '備註摘要'
  ]

  const rows = Array.isArray(orderRows)
    ? orderRows.map(order => ([
        order.orderNo,
        order.tableCode,
        order.createdAt,
        reportStatusLabels[order.status] || order.status,
        reportPaymentStatusLabels[order.paymentStatus] || order.paymentStatus,
        reportPaymentMethodLabels[order.paymentMethod] || order.paymentMethod,
        order.totalAmount,
        order.itemCount,
        order.staffNoteSummary || ''
      ]))
    : []

  return [...metaRows, header, ...rows]
    .map(row => row.map(escapeCsvValue).join(','))
    .join('\n')
}

export { reportStatusLabels, reportPaymentStatusLabels, reportPaymentMethodLabels }
