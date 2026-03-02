import { purchaseApi } from './api/purchaseApi.js'

function unwrap(result, fallbackMessage) {
  if (!result.ok) {
    throw new Error(result.data?.error?.message || fallbackMessage)
  }

  return result.data?.data
}

export async function fetchPurchaseRecords() {
  return unwrap(await purchaseApi.list(), '無法取得採購資料')
}

export async function createPurchaseRecord(payload) {
  return unwrap(await purchaseApi.create(payload), '無法建立採購單')
}

export async function updatePurchaseRecord(id, payload) {
  return unwrap(await purchaseApi.update(id, payload), '無法更新採購單')
}
