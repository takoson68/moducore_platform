import { apiRequest } from '@/app/api'

export const announcementApi = {
  list() {
    return apiRequest('/api/flowcenter/announcements', { method: 'GET', tokenQuery: true })
  },
  create(payload) {
    return apiRequest('/api/flowcenter/announcements', { method: 'POST', body: payload, tokenQuery: true })
  },
  update(id, payload) {
    return apiRequest('/api/flowcenter/announcements', { method: 'PATCH', body: { id, ...payload }, tokenQuery: true })
  },
  remove(id) {
    return apiRequest('/api/flowcenter/announcements/delete', { method: 'POST', body: { id }, tokenQuery: true })
  }
}
