import { approvalApi } from './api/approvalApi.js'

function unwrap(result, fallbackMessage) {
  if (!result.ok) {
    throw new Error(result.data?.error?.message || fallbackMessage)
  }

  return result.data?.data
}

export async function fetchApprovalRecords() {
  return unwrap(await approvalApi.listPending(), '無法取得待審清單')
}

export async function submitApprovalDecision(payload) {
  return unwrap(await approvalApi.decide(payload), '無法送出審核決策')
}
