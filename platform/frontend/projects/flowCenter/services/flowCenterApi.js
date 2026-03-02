import { apiRequest } from '@/app/api'

export function flowCenterRequest(path, options = {}) {
  return apiRequest(path, options)
}

export const flowCenterApi = {
  get(path, options = {}) {
    return flowCenterRequest(path, { ...options, method: 'GET' })
  },
  post(path, body, options = {}) {
    return flowCenterRequest(path, { ...options, method: 'POST', body })
  },
  patch(path, body, options = {}) {
    return flowCenterRequest(path, { ...options, method: 'PATCH', body })
  }
}
