import { mockApiRequest } from '@project/api/mockRequest.js'

export async function loadDashboardSummary() {
  return mockApiRequest('dashboard/summary')
}
