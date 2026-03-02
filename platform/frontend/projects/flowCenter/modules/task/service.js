import { taskApi } from './api/taskApi.js'

function unwrap(result, fallbackMessage) {
  if (!result.ok) {
    throw new Error(result.data?.error?.message || fallbackMessage)
  }

  return result.data?.data
}

export async function fetchTasks() {
  return unwrap(await taskApi.list(), '無法取得任務資料')
}

export async function createTaskRecord(payload) {
  return unwrap(await taskApi.create(payload), '無法建立任務')
}

export async function updateTaskRecord(id, payload) {
  return unwrap(await taskApi.update(id, payload), '無法更新任務')
}

export async function deleteTaskRecord(id) {
  return unwrap(await taskApi.remove(id), '無法刪除任務')
}
