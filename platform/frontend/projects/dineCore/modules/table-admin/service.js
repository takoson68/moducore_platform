import world from '@/world.js'
import { mockApiRequest } from '@project/api/mockRequest.js'

function unwrapResult(result) {
  if (result?.ok && result?.data?.ok) {
    return result.data.data
  }

  if (result?.ok) {
    return result.data
  }

  const code = String(
    result?.data?.error?.code ||
      result?.data?.data?.error?.code ||
      result?.status ||
      'API_ERROR'
  )
  const message = String(
    result?.data?.error?.message ||
      result?.data?.data?.error?.message ||
      result?.data?.data?.message ||
      result?.data?.message ||
      ''
  ).trim()

  throw new Error(message && message !== code ? `${code}: ${message}` : code)
}

export async function loadTableAdminTables() {
  if (world.apiMode() === 'real') {
    const payload = unwrapResult(
      await world.http().get('/api/dinecore/staff/tables', { tokenQuery: true })
    )

    const tables = Array.isArray(payload) ? payload : []
    return {
      tables: tables.map((table, index) => ({
        id: table.id,
        code: String(table.code || ''),
        name: String(table.name || ''),
        areaName: String(table.areaName || ''),
        dineMode: String(table.dineMode || 'dine_in'),
        status: String(table.status || 'active'),
        orderingEnabled: Boolean(table.orderingEnabled),
        qrImageUrl: String(table.qrImageUrl || ''),
        sortOrder: index + 1
      }))
    }
  }

  return mockApiRequest('table-admin/tables')
}

export async function createTableAdminTable(payload) {
  return mockApiRequest('table-admin/create-table', payload)
}

export async function updateTableAdminTable(payload) {
  return mockApiRequest('table-admin/update-table', payload)
}

export async function deleteTableAdminTable(payload) {
  return mockApiRequest('table-admin/delete-table', payload)
}

export async function reorderTableAdminTables(payload) {
  return mockApiRequest('table-admin/reorder-tables', payload)
}

export async function generateTableAdminQr(payload) {
  if (world.apiMode() !== 'real') {
    throw new Error('REAL_API_REQUIRED')
  }

  return unwrapResult(
    await world.http().post(
      '/api/dinecore/staff/tables/generate-qr',
      {
        table_code: String(payload?.tableCode || payload?.table_code || '').trim().toUpperCase(),
        entry_base_url: String(payload?.entryBaseUrl || payload?.entry_base_url || '').trim()
      },
      { tokenQuery: true }
    )
  )
}
