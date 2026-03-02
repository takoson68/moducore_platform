import { leaveApi } from './api/leaveApi.js'

function unwrap(result, fallbackMessage) {
  if (!result.ok) {
    throw new Error(result.data?.error?.message || fallbackMessage)
  }

  return result.data?.data
}

export async function fetchLeaveRecords() {
  return unwrap(await leaveApi.list(), '無法取得請假資料')
}

export async function createLeaveRecord(payload) {
  return unwrap(await leaveApi.create(payload), '無法建立請假單')
}

export async function updateLeaveRecord(id, payload) {
  return unwrap(await leaveApi.update(id, payload), '無法更新請假單')
}
