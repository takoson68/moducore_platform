import world from '@/world.js'
import { mockApiRequest } from '@project/api/mockRequest.js'

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
    if (Object.prototype.hasOwnProperty.call(result.data || {}, 'data')) {
      return result.data.data
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

export async function dineCoreRequest(
  mockAction,
  { path, method = 'GET', query, body, mockPayload } = {}
) {
  if (world.apiMode() !== 'real') {
    return mockApiRequest(
      mockAction,
      mockPayload ?? (method === 'GET' ? query : body)
    )
  }

  const http = world.http()

  if (method === 'GET') {
    return unwrapResult(await http.get(`${path}${buildQuery(query)}`))
  }

  return unwrapResult(await http.post(path, body))
}
