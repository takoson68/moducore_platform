import { announcementApi } from './api/announcementApi.js'

function unwrap(result, fallbackMessage) {
  if (!result.ok) {
    throw new Error(result.data?.error?.message || fallbackMessage)
  }

  return result.data?.data
}

export async function fetchAnnouncements() {
  return unwrap(await announcementApi.list(), '無法取得公告資料')
}

export async function createAnnouncementRecord(payload) {
  return unwrap(await announcementApi.create(payload), '無法建立公告')
}

export async function updateAnnouncementRecord(id, payload) {
  return unwrap(await announcementApi.update(id, payload), '無法更新公告')
}

export async function deleteAnnouncementRecord(id) {
  return unwrap(await announcementApi.remove(id), '無法刪除公告')
}
