import { loadVisitorStats, trackVisitorStats } from './api/visitorStatsApi.js'

const allowedRanges = new Set(['today', '7d', '30d'])
const allowedSourceTags = new Set(['tagged', 'direct'])

function normalizeRange(range) {
  const safeRange = String(range || '').trim()
  return allowedRanges.has(safeRange) ? safeRange : 'today'
}

function normalizeSourceTag(sourceTag) {
  const safeTag = String(sourceTag || '').trim()
  return allowedSourceTags.has(safeTag) ? safeTag : 'direct'
}

function translateVisitorStatsError(error) {
  const code = error instanceof Error ? error.message : String(error || '')

  switch (code) {
    case 'STAFF_SESSION_REQUIRED':
      return ''
    case 'STAFF_ROLE_FORBIDDEN':
      return '你沒有權限查看每日 IP 訪客統計。'
    default:
      return code || '每日 IP 訪客統計載入失敗。'
  }
}

export async function recordVisitorEntry(payload = {}) {
  await trackVisitorStats({
    path: String(payload.path || '/').trim() || '/',
    search: String(payload.search || '').trim()
  })
}

export async function loadVisitorStatsSnapshot(range = 'today') {
  try {
    const payload = await loadVisitorStats(normalizeRange(range))

    return {
      range: normalizeRange(payload.range),
      rows: Array.isArray(payload.rows)
        ? payload.rows.map(row => ({
            visitDate: row.visitDate || '',
            ipAddress: row.ipAddress || '',
            path: row.path || '/',
            sourceTag: normalizeSourceTag(row.sourceTag),
            visitCount: Number(row.visitCount || 0),
            firstVisitedAt: row.firstVisitedAt || '',
            lastVisitedAt: row.lastVisitedAt || ''
          }))
        : []
    }
  } catch (error) {
    throw new Error(translateVisitorStatsError(error))
  }
}
