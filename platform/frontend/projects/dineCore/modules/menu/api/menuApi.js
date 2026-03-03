import { dineCoreRequest } from '@project/api/dineCoreRequest.js'

export function getMenuPayload(tableCode, orderingSessionToken = '') {
  return dineCoreRequest('menu/list', {
    path: '/api/dinecore/menu',
    method: 'GET',
    mockPayload: {
      tableCode,
      orderingSessionToken
    },
    query: {
      table_code: tableCode,
      ordering_session_token: orderingSessionToken
    }
  })
}
