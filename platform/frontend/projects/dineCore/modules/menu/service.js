import { getMenuPayload } from './api/menuApi.js'

export async function loadMenuPayload(tableCode, orderingSessionToken = '') {
  return getMenuPayload(tableCode, orderingSessionToken)
}
