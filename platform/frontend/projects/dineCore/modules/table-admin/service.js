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

function normalizeTable(table = {}, index = 0) {
  return {
    id: Number(table.id || 0),
    code: String(table.code || ''),
    label: String(table.label || table.name || ''),
    name: String(table.name || ''),
    areaName: String(table.areaName || ''),
    note: String(table.note || ''),
    dineMode: String(table.dineMode || 'dine_in'),
    status: String(table.status || 'active'),
    orderingEnabled: Boolean(table.orderingEnabled),
    sortOrder: Number(table.sortOrder || index + 1),
    mapId: String(table.mapId || ''),
    mapTableId: String(table.mapTableId || ''),
    maxActiveOrders: Math.max(1, Number(table.maxActiveOrders || 1)),
    currentOpenOrderCount: Math.max(0, Number(table.currentOpenOrderCount || 0)),
    operationalStatus: String(table.operationalStatus || 'normal'),
    operationalStatusLabel: String(table.operationalStatusLabel || '????'),
    hasActiveOrder: Boolean(table.hasActiveOrder),
    activeOrderNo: String(table.activeOrderNo || ''),
    qrImageUrl: String(table.qrImageUrl || '')
  }
}

function normalizeMapSummary(map = {}) {
  return {
    id: String(map.id || map.mapId || ''),
    mapId: String(map.mapId || map.id || ''),
    name: String(map.name || ''),
    width: Number(map.width || 0),
    height: Number(map.height || 0),
    updatedAt: String(map.updatedAt || ''),
    savedAt: String(map.savedAt || ''),
    availableStatuses: Array.isArray(map.availableStatuses) ? map.availableStatuses : []
  }
}

function normalizeMapDetail(payload = {}) {
  const map = payload?.map && typeof payload.map === 'object' ? payload.map : payload?.payload || {}
  return {
    id: String(map.id || payload.mapId || payload.id || ''),
    mapId: String(payload.mapId || map.id || payload.id || ''),
    name: String(map.name || payload.name || ''),
    width: Number(map.width || 0),
    height: Number(map.height || 0),
    updatedAt: String(payload.updatedAt || map.updatedAt || ''),
    savedAt: String(payload.savedAt || map.savedAt || ''),
    tables: Array.isArray(map.tables) ? map.tables : []
  }
}

export async function loadTableAdminMaps() {
  if (world.apiMode() === 'real') {
    const payload = unwrapResult(
      await world.http().get('/api/dinecore/staff/map-editor/final-list', { tokenQuery: true })
    )

    const maps = Array.isArray(payload?.maps) ? payload.maps : []
    return {
      maps: maps.map(normalizeMapSummary)
    }
  }

  return {
    maps: []
  }
}

export async function loadTableAdminMapDetail(mapId) {
  if (world.apiMode() === 'real') {
    const payload = unwrapResult(
      await world.http().get(
        `/api/dinecore/staff/map-editor/final-load?map_id=${encodeURIComponent(String(mapId || ''))}`,
        { tokenQuery: true }
      )
    )

    return normalizeMapDetail(payload)
  }

  return mockApiRequest('table-admin/map-detail', { mapId })
}

export async function loadTableAdminTables(payload = {}) {
  if (world.apiMode() === 'real') {
    const mapId = String(payload?.mapId || payload?.map_id || '').trim()
    const query = mapId ? `?map_id=${encodeURIComponent(mapId)}` : ''
    const result = unwrapResult(
      await world.http().get(`/api/dinecore/staff/tables${query}`, { tokenQuery: true })
    )

    const tables = Array.isArray(result) ? result : []
    return {
      tables: tables.map((table, index) => normalizeTable(table, index))
    }
  }

  return mockApiRequest('table-admin/tables', payload)
}

export async function importTableAdminTablesFromMap(payload = {}) {
  if (world.apiMode() === 'real') {
    return unwrapResult(
      await world.http().post(
        '/api/dinecore/staff/tables/import-from-map',
        {
          map_id: String(payload?.mapId || payload?.map_id || '').trim()
        },
        { tokenQuery: true }
      )
    )
  }

  return mockApiRequest('table-admin/import-from-map', payload)
}

export async function reimportTableAdminTablesFromMap(payload = {}) {
  if (world.apiMode() === 'real') {
    return unwrapResult(
      await world.http().post(
        '/api/dinecore/staff/tables/reimport-from-map',
        {
          map_id: String(payload?.mapId || payload?.map_id || '').trim()
        },
        { tokenQuery: true }
      )
    )
  }

  return mockApiRequest('table-admin/reimport-from-map', payload)
}

export async function updateTableAdminTable(payload) {
  if (world.apiMode() === 'real') {
    return unwrapResult(
      await world.http().post(
        '/api/dinecore/staff/tables/update',
        {
          code: String(payload?.code || '').trim().toUpperCase(),
          note: payload?.note,
          max_active_orders: payload?.maxActiveOrders ?? payload?.max_active_orders,
          status: payload?.status,
          ordering_enabled: payload?.orderingEnabled
        },
        { tokenQuery: true }
      )
    )
  }

  return mockApiRequest('table-admin/update-table', payload)
}

export async function generateTableAdminQr(payload) {
  if (world.apiMode() !== 'real') {
    throw new Error('REAL_API_REQUIRED')
  }

  const body = {
    table_code: String(payload?.tableCode || payload?.table_code || '').trim().toUpperCase(),
    entry_base_url: String(payload?.entryBaseUrl || payload?.entry_base_url || '').trim()
  }

  return unwrapResult(
    await world.http().post('/api/dinecore/staff/tables/generate-qr', body, { tokenQuery: true })
  )
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