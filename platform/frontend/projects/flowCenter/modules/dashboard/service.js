import { flowCenterApi } from '@project/services/flowCenterApi.js'

function unwrap(result, fallbackMessage) {
  if (!result.ok) {
    throw new Error(result.data?.error?.message || fallbackMessage)
  }

  return result.data?.data
}

export async function fetchDashboardSummary() {
  return unwrap(
    await flowCenterApi.get('/api/flowcenter/dashboard/summary'),
    '無法取得儀表板摘要'
  )
}
