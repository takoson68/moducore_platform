import { flowCenterApi } from '@project/services/flowCenterApi.js'

function unwrap(result, fallbackMessage) {
  if (!result.ok) {
    throw new Error(result.data?.error?.message || fallbackMessage)
  }

  return result.data?.data
}

export async function fetchApprovalRecords() {
  return unwrap(await flowCenterApi.get('/api/flowcenter/approval/pending'), '無法取得待審清單')
}

export async function submitApprovalDecision(payload) {
  return unwrap(await flowCenterApi.post('/api/flowcenter/approval/decide', payload), '無法送出審核決策')
}
