import { getEntryContext } from './api/entryApi.js'

export async function loadEntryContext(tableCode, orderingSessionToken = '') {
  return getEntryContext(tableCode, orderingSessionToken)
}

export function mapEntryError(error) {
  const code = String(error?.message || '')

  switch (code) {
    case 'TABLE_CODE_REQUIRED':
      return '缺少桌號資訊，請重新掃描桌邊 QR Code。'
    case 'TABLE_NOT_FOUND':
      return '找不到這個桌號，請重新掃描桌邊 QR Code。'
    case 'TABLE_INACTIVE':
      return '這個桌號目前未啟用，請洽現場人員。'
    case 'ORDERING_DISABLED':
      return '這桌目前暫停接單，請稍後再試。'
    case 'ORDERING_SESSION_REQUIRED':
      return '點餐身份已失效，請重新整理後再試。'
    case 'TABLE_SESSION_NOT_FOUND':
      return '目前無法取得桌位點餐狀態，請重新整理後再試。'
    default:
      return '目前無法建立點餐身份，請重新整理後再試。'
  }
}

export function shouldRetryEntryContext(error) {
  const code = String(error?.message || '')
  return code === 'ORDERING_SESSION_REQUIRED' || code === 'TABLE_SESSION_NOT_FOUND'
}
