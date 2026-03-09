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
        sortOrder: Number(table.sortOrder || index + 1)
      }))
    }
  }

  return mockApiRequest('table-admin/tables')
}

export async function createTableAdminTable(payload) {
  if (world.apiMode() === 'real') {
    return unwrapResult(
      await world.http().post(
        '/api/dinecore/staff/tables/create',
        {
          code: String(payload?.code || '').trim().toUpperCase(),
          name: String(payload?.name || '').trim(),
          area_name: String(payload?.areaName || payload?.area_name || '').trim(),
          dine_mode: String(payload?.dineMode || payload?.dine_mode || 'dine_in').trim()
        },
        { tokenQuery: true }
      )
    )
  }

  return mockApiRequest('table-admin/create-table', payload)
}

export async function updateTableAdminTable(payload) {
  if (world.apiMode() === 'real') {
    return unwrapResult(
      await world.http().post(
        '/api/dinecore/staff/tables/update',
        {
          code: String(payload?.code || '').trim().toUpperCase(),
          name: payload?.name,
          area_name: payload?.areaName ?? payload?.area_name,
          dine_mode: payload?.dineMode ?? payload?.dine_mode,
          status: payload?.status,
          ordering_enabled: payload?.orderingEnabled
        },
        { tokenQuery: true }
      )
    )
  }

  return mockApiRequest('table-admin/update-table', payload)
}

export async function deleteTableAdminTable(payload) {
  if (world.apiMode() === 'real') {
    return unwrapResult(
      await world.http().post(
        '/api/dinecore/staff/tables/delete',
        {
          code: String(payload?.code || '').trim().toUpperCase()
        },
        { tokenQuery: true }
      )
    )
  }

  return mockApiRequest('table-admin/delete-table', payload)
}

export async function reorderTableAdminTables(payload) {
  if (world.apiMode() === 'real') {
    return unwrapResult(
      await world.http().post(
        '/api/dinecore/staff/tables/reorder',
        {
          code: String(payload?.code || '').trim().toUpperCase(),
          direction: String(payload?.direction || '').trim().toLowerCase()
        },
        { tokenQuery: true }
      )
    )
  }

  return mockApiRequest('table-admin/reorder-tables', payload)
}

export async function generateTableAdminQr(payload) {
  if (world.apiMode() !== 'real') {
    throw new Error('REAL_API_REQUIRED')
  }

  const body = {
    table_code: String(payload?.tableCode || payload?.table_code || '').trim().toUpperCase(),
    entry_base_url: String(payload?.entryBaseUrl || payload?.entry_base_url || '').trim()
  }
  const paths = [
    '/api/dinecore/staff/tables/generate-qr',
    '/api/dinecore/staff/tables/generate-qr/',
    '/api/dinecore/staff/table/generate-qr',
    '/api/dinecore/staff/tables/generate_qr'
  ]

  let lastError = null
  for (const path of paths) {
    try {
      return unwrapResult(await world.http().post(path, body, { tokenQuery: true }))
    } catch (error) {
      const message = String(error?.message || '')
      const isNotFound =
        message === 'NOT_FOUND' ||
        message.includes('404') ||
        message.toUpperCase().includes('NOT FOUND')
      if (!isNotFound) {
        throw error
      }
      lastError = error
    }
  }

  // Fallback: if backend QR route is unavailable in current env, generate QR in browser.
  if (typeof window !== 'undefined' && body.table_code) {
    const baseUrl = body.entry_base_url || window.location.origin
    const entryUrl = `${String(baseUrl).replace(/\/+$/, '')}/t/${body.table_code}`
    const publicUrl = `https://api.qrserver.com/v1/create-qr-code/?size=512x512&data=${encodeURIComponent(entryUrl)}`

    return {
      tableCode: body.table_code,
      fileName: `${body.table_code}.png`,
      publicUrl,
      entryUrl,
      updatedAt: new Date().toISOString(),
      generatedBy: 'frontend-fallback'
    }
  }

  throw lastError || new Error('NOT_FOUND')
}

export async function clearTableAdminGuestSessions(payload = {}) {
  if (world.apiMode() !== 'real') {
    throw new Error('REAL_API_REQUIRED')
  }

  const tableCode = String(payload?.tableCode || payload?.table_code || '')
    .trim()
    .toUpperCase()
  if (!tableCode) {
    throw new Error('TABLE_CODE_REQUIRED')
  }

  return unwrapResult(
    await world.http().post(
      '/api/dinecore/staff/sessions/clear',
      { table_code: tableCode },
      { tokenQuery: true }
    )
  )
}
