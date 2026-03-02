import { dashboardApi } from './api/dashboardApi.js'

function unwrap(result, fallbackMessage) {
  if (!result.ok) {
    throw new Error(result.data?.error?.message || fallbackMessage)
  }

  return result.data?.data
}

export async function fetchDashboardSummary() {
  return unwrap(await dashboardApi.summary(), '無法取得儀表板摘要')
}
