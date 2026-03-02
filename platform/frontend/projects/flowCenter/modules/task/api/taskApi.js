import { apiRequest } from '@/app/api'

export const taskApi = {
  list() {
    return apiRequest('/api/flowcenter/tasks', { method: 'GET', tokenQuery: true })
  },
  create(payload) {
    return apiRequest('/api/flowcenter/tasks', { method: 'POST', body: payload, tokenQuery: true })
  },
  update(id, payload) {
    return apiRequest('/api/flowcenter/tasks', { method: 'PATCH', body: { id, ...payload }, tokenQuery: true })
  },
  remove(id) {
    return apiRequest('/api/flowcenter/tasks/delete', { method: 'POST', body: { id }, tokenQuery: true })
  }
}
