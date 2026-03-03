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
      return '請先登入員工帳號後再操作關帳。'
    case 'STAFF_ROLE_FORBIDDEN':
      return '目前帳號沒有執行關帳或解鎖的權限。'
    case 'AUDIT_CLOSE_BLOCKED':
      return '目前仍有阻塞項目，請先完成未付款或未完成訂單。'
    case 'BUSINESS_DATE_ALREADY_CLOSED':
      return '這個營業日已經關帳，不可重複執行。'
    case 'BUSINESS_DATE_NOT_CLOSED':
      return '這個營業日目前尚未關帳，無法解鎖。'
    case 'UNLOCK_REASON_REQUIRED':
      return '解鎖營業日前必須填寫解鎖原因。'
    case 'AUDIT_CLOSE_LOAD_FAILED':
      return '關帳資料載入失敗，請稍後再試。'
    case 'AUDIT_CLOSE_SUBMIT_FAILED':
      return '關帳失敗，請稍後再試。'
    case 'AUDIT_CLOSE_UNLOCK_FAILED':
      return '解鎖失敗，請稍後再試。'
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
