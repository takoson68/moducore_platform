import { mockApiRequest } from '@project/api/mockRequest.js'

export async function loadEntryContext(tableCode) {
  return mockApiRequest('entry/context', { tableCode })
}
