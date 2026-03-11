import world from '@/world.js'
import { mockApiRequest } from '@project/api/mockRequest.js'
import { staffApiRequest } from '@project/api/staffApiRequest.js'

function unwrapResult(result) {
  if (result?.ok && result?.data?.ok) return result.data.data
  if (result?.ok) return result.data

  const code =
    result?.data?.error?.code ||
    result?.data?.data?.error?.code ||
    result?.data?.message ||
    result?.status ||
    'API_ERROR'

  throw new Error(String(code))
}

export async function trackVisitorStats(payload = {}) {
  if (world.apiMode() !== 'real') {
    return mockApiRequest('visitor-stats/track', payload)
  }

  return unwrapResult(
    await world.http().post('/api/dinecore/visitor-stats/track', payload)
  )
}

export async function loadVisitorStats(range = 'today') {
  if (world.apiMode() !== 'real') {
    return mockApiRequest('visitor-stats/list', { range })
  }

  return staffApiRequest('visitor-stats/list', {
    path: '/api/dinecore/staff/visitor-stats',
    query: {
      range: String(range || 'today')
    }
  })
}
