//- src/app/api/client.js
import { apiRequest } from '@/app/api'

export function createClient() {
  return {
    get(path, options = {}) {
      return apiRequest(path, { ...options, method: 'GET' })
    },
    post(path, body, options = {}) {
      return apiRequest(path, { ...options, method: 'POST', body })
    },
  }
}
