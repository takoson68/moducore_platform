import { flowCenterApi } from '@project/services/flowCenterApi.js'

function unwrap(result, fallbackMessage) {
  if (!result.ok) {
    throw new Error(result.data?.error?.message || fallbackMessage)
  }

  return result.data?.data
}

export async function fetchLeaveRecords() {
  return unwrap(await flowCenterApi.get('/api/flowcenter/leave'), '無法取得請假資料')
}

export async function createLeaveRecord(payload) {
  return unwrap(await flowCenterApi.post('/api/flowcenter/leave', payload), '無法建立請假單')
}
