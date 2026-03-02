import { apiRequest } from '@/app/api'

export const approvalApi = {
  listPending() {
    return apiRequest('/api/flowcenter/approval/pending', { method: 'GET', tokenQuery: true })
  },
  decide(payload) {
    return apiRequest('/api/flowcenter/approval/decide', { method: 'POST', body: payload, tokenQuery: true })
  }
}
