import { dineCoreRequest } from '@project/api/dineCoreRequest.js'

export function getEntryContext(tableCode, orderingSessionToken = '') {
  return dineCoreRequest('entry/context', {
    path: '/api/dinecore/entry-context',
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
