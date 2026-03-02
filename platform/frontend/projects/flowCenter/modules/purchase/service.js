import { flowCenterApi } from '@project/services/flowCenterApi.js'

function unwrap(result, fallbackMessage) {
  if (!result.ok) {
    throw new Error(result.data?.error?.message || fallbackMessage)
  }

  return result.data?.data
}

export async function fetchPurchaseRecords() {
  return unwrap(await flowCenterApi.get('/api/flowcenter/purchase'), '無法取得採購資料')
}

export async function createPurchaseRecord(payload) {
  return unwrap(await flowCenterApi.post('/api/flowcenter/purchase', payload), '無法建立採購單')
}
