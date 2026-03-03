import { getEntryContext } from './api/entryApi.js'

export async function loadEntryContext(tableCode, orderingSessionToken = '') {
  return getEntryContext(tableCode, orderingSessionToken)
}

export function mapEntryError(error) {
  const code = String(error?.message || '')

  switch (code) {
    case 'TABLE_NOT_FOUND':
      return '找不到這個桌號，請重新掃描桌邊 QR Code。'
    case 'TABLE_INACTIVE':
      return '這個桌號目前未啟用，請洽現場人員。'
    case 'ORDERING_DISABLED':
      return '這桌目前暫停接單，請稍後再試。'
    default:
      return '目前無法建立點餐身份，請重新整理後再試。'
  }
}
