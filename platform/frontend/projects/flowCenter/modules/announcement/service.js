import { flowCenterApi } from '@project/services/flowCenterApi.js'

function unwrap(result, fallbackMessage) {
  if (!result.ok) {
    throw new Error(result.data?.error?.message || fallbackMessage)
  }

  return result.data?.data
}

export async function fetchAnnouncements() {
  return unwrap(await flowCenterApi.get('/api/flowcenter/announcements'), '無法取得公告資料')
}

export async function createAnnouncementRecord(payload) {
  return unwrap(await flowCenterApi.post('/api/flowcenter/announcements', payload), '無法建立公告')
}

export async function deleteAnnouncementRecord(id) {
  return unwrap(
    await flowCenterApi.post('/api/flowcenter/announcements/delete', { id }),
    '無法刪除公告'
  )
}
