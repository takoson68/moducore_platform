import {
  closeBusinessDate,
  loadAuditCloseHistory,
  loadAuditCloseSummary,
  unlockBusinessDate
} from './api/auditCloseApi.js'

function translateAuditCloseError(error) {
  const code = error instanceof Error ? error.message : String(error || '')

  switch (code) {
    case 'STAFF_SESSION_REQUIRED':
      return '請先登入管理者帳號再執行關帳。'
    case 'STAFF_ROLE_FORBIDDEN':
      return '目前帳號沒有關帳權限。'
    case 'AUDIT_CLOSE_BLOCKED':
      return '目前仍有未完成或未付款訂單，無法關帳。'
    case 'BUSINESS_DATE_ALREADY_CLOSED':
      return '該營業日已經關帳。'
    case 'BUSINESS_DATE_NOT_CLOSED':
      return '該營業日尚未關帳，無法解鎖。'
    case 'UNLOCK_REASON_REQUIRED':
      return '解鎖營業日必須填寫原因。'
    case 'AUDIT_CLOSE_LOAD_FAILED':
      return '關帳資料載入失敗。'
    case 'AUDIT_CLOSE_SUBMIT_FAILED':
      return '關帳失敗。'
    case 'AUDIT_CLOSE_UNLOCK_FAILED':
      return '解鎖失敗。'
    default:
      return code || '關帳流程發生未預期錯誤。'
  }
}

function normalizeSummary(payload = {}) {
  return {
    businessDate: payload.businessDate || '',
    grossSales: Number(payload.grossSales || 0),
    paidAmount: Number(payload.paidAmount || 0),
    unpaidAmount: Number(payload.unpaidAmount || 0),
    orderCount: Number(payload.orderCount || 0),
    unfinishedOrderCount: Number(payload.unfinishedOrderCount || 0),
    closeStatus: payload.closeStatus || 'open',
    closedAt: payload.closedAt || '',
    closedBy: payload.closedBy || ''
  }
}

function normalizeLockState(payload = {}) {
  return {
    businessDate: payload.businessDate || '',
    isLocked: Boolean(payload.isLocked),
    lockedScopes: Array.isArray(payload.lockedScopes) ? payload.lockedScopes : []
  }
}

function normalizeHistory(entries = []) {
  return Array.isArray(entries)
    ? entries.map(entry => ({
        id: entry.id,
        businessDate: entry.businessDate || '',
        action: entry.action || '',
        actorName: entry.actorName || '',
        actorRole: entry.actorRole || '',
        createdAt: entry.createdAt || '',
        reason: entry.reason || '',
        reasonType: entry.reasonType || 'general',
        affectedScopes: Array.isArray(entry.affectedScopes) ? entry.affectedScopes : [],
        beforeStatus: entry.beforeStatus || '',
        afterStatus: entry.afterStatus || ''
      }))
    : []
}

export async function loadAuditCloseSnapshot(businessDate) {
  try {
    const [summaryPayload, historyPayload] = await Promise.all([
      loadAuditCloseSummary(businessDate),
      loadAuditCloseHistory(businessDate)
    ])

    return {
      closingSummary: normalizeSummary(summaryPayload.closingSummary),
      blockingIssues: Array.isArray(summaryPayload.blockingIssues) ? summaryPayload.blockingIssues : [],
      lockState: normalizeLockState(summaryPayload.lockState),
      closeHistory: normalizeHistory(historyPayload.history)
    }
  } catch (error) {
    throw new Error(translateAuditCloseError(error))
  }
}

export async function submitAuditClose({ businessDate, reason = '', reasonType = 'daily_close' } = {}) {
  try {
    return await closeBusinessDate(businessDate, reason, reasonType)
  } catch (error) {
    throw new Error(translateAuditCloseError(error))
  }
}

export async function submitAuditUnlock({ businessDate, reason = '', reasonType = 'correction' } = {}) {
  try {
    return await unlockBusinessDate(businessDate, reason, reasonType)
  } catch (error) {
    throw new Error(translateAuditCloseError(error))
  }
}
