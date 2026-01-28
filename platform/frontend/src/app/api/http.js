//- src/app/api/http.js
import { apiRequest } from '@/app/api'

export const http = {
  get(path, options = {}) {
    return apiRequest(path, { ...options, method: 'GET' })
  },
  post(path, body, options = {}) {
    return apiRequest(path, { ...options, method: 'POST', body })
  },
}
