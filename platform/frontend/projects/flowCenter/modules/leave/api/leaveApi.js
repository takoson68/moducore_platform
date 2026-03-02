import { apiRequest } from '@/app/api'

export const leaveApi = {
  list() {
    return apiRequest('/api/flowcenter/leave', { method: 'GET', tokenQuery: true })
  },
  create(payload) {
    return apiRequest('/api/flowcenter/leave', { method: 'POST', body: payload, tokenQuery: true })
  },
  update(id, payload) {
    return apiRequest('/api/flowcenter/leave', { method: 'PATCH', body: { id, ...payload }, tokenQuery: true })
  }
}
