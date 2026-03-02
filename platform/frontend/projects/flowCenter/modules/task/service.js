import { flowCenterApi } from '@project/services/flowCenterApi.js'

function unwrap(result, fallbackMessage) {
  if (!result.ok) {
    throw new Error(result.data?.error?.message || fallbackMessage)
  }

  return result.data?.data
}

export async function fetchTasks() {
  return unwrap(await flowCenterApi.get('/api/flowcenter/tasks'), '無法取得任務資料')
}

export async function createTaskRecord(payload) {
  return unwrap(await flowCenterApi.post('/api/flowcenter/tasks', payload), '無法建立任務')
}

export async function deleteTaskRecord(id) {
  return unwrap(await flowCenterApi.post('/api/flowcenter/tasks/delete', { id }), '無法刪除任務')
}
