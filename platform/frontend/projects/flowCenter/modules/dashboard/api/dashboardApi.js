import { apiRequest } from '@/app/api'

export const dashboardApi = {
  summary() {
    return apiRequest('/api/flowcenter/dashboard/summary', { method: 'GET', tokenQuery: true })
  }
}
