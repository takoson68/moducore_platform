import { mockApiRequest } from '@project/api/mockRequest.js'

export async function loadMenuPayload(tableCode) {
  return mockApiRequest('menu/list', { tableCode })
}
