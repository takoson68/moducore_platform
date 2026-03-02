import { apiRequest } from '@/app/api'

export const purchaseApi = {
  list() {
    return apiRequest('/api/flowcenter/purchase', { method: 'GET', tokenQuery: true })
  },
  create(payload) {
    return apiRequest('/api/flowcenter/purchase', { method: 'POST', body: payload, tokenQuery: true })
  },
  update(id, payload) {
    return apiRequest('/api/flowcenter/purchase', { method: 'PATCH', body: { id, ...payload }, tokenQuery: true })
  }
}
