import { apiRequest } from '@/app/api'
import { mockApiRequest } from '@project/api/mockRequest.js'
import world from '@/world.js'

function buildQuery(query = {}) {
  const params = new URLSearchParams()

  Object.entries(query).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') return
    params.set(key, String(value))
  })

  const text = params.toString()
  return text ? `?${text}` : ''
}

function unwrapResult(result) {
  if (result?.ok) {
    if (result?.data && typeof result.data === 'object' && 'ok' in result.data) {
      if (result.data.ok) {
        return result.data.data
      }

      const nestedCode =
        result.data?.error?.code ||
        result.data?.message ||
        'API_ERROR'

      throw new Error(String(nestedCode))
    }

    return result.data
  }

  const code =
    result?.data?.error?.code ||
    result?.data?.message ||
    result?.status ||
    'API_ERROR'

  throw new Error(String(code))
}

export async function staffApiRequest(
  mockAction,
  { path, method = 'GET', query, body, mockPayload } = {}
) {
  if (world.apiMode() !== 'real') {
    return mockApiRequest(
      mockAction,
      mockPayload ?? (method === 'GET' ? query : body)
    )
  }

  if (method === 'GET') {
    return unwrapResult(await apiRequest(`${path}${buildQuery(query)}`, { method: 'GET', tokenQuery: true }))
  }

  return unwrapResult(await apiRequest(path, { method: 'POST', body, tokenQuery: true }))
}
