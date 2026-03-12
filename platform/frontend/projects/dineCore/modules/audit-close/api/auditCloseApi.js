import { staffApiRequest } from '@project/api/staffApiRequest.js'

export async function loadAuditCloseSummary(businessDate) {
  return staffApiRequest('audit-close/summary', {
    path: '/api/dinecore/staff/audit-close/summary',
    method: 'GET',
    mockPayload: { businessDate },
    query: {
      business_date: businessDate
    }
  })
}

export async function loadAuditCloseHistory(businessDate) {
  return staffApiRequest('audit-close/history', {
    path: '/api/dinecore/staff/audit-close/history',
    method: 'GET',
    mockPayload: { businessDate },
    query: {
      business_date: businessDate
    }
  })
}

export async function closeBusinessDate(businessDate, reason = '', reasonType = 'daily_close') {
  return staffApiRequest('audit-close/close', {
    path: '/api/dinecore/staff/audit-close/close',
    method: 'POST',
    mockPayload: { businessDate, reason, reasonType },
    body: {
      business_date: businessDate,
      reason,
      reason_type: reasonType
    }
  })
}

export async function unlockBusinessDate(businessDate, reason = '', reasonType = 'correction') {
  return staffApiRequest('audit-close/unlock', {
    path: '/api/dinecore/staff/audit-close/unlock',
    method: 'POST',
    mockPayload: { businessDate, reason, reasonType },
    body: {
      business_date: businessDate,
      reason,
      reason_type: reasonType
    }
  })
}
