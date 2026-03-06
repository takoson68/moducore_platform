import { getOrderTracker } from './api/orderTrackerApi.js'

export async function loadOrderTrackerPayload(tableCode, orderId, orderingSessionToken = '') {
  return getOrderTracker(tableCode, orderId, orderingSessionToken)
}

export function mapOrderTrackerError(error) {
  const code = String(error?.message || '')

  switch (code) {
    case 'ORDER_NOT_FOUND':
      return '找不到該筆訂單，請確認是否已送單。'
    case 'ORDER_FORBIDDEN':
      return '此訂單不是目前掃碼身份建立，無法查看。'
    case 'ORDERING_SESSION_REQUIRED':
      return '需要有效的顧客掃碼狀態，請重新掃桌號 QR。'
    case 'TABLE_CODE_REQUIRED':
      return '缺少桌號資訊，請從桌號頁重新進入。'
    case 'ORDER_ID_REQUIRED':
      return '缺少訂單編號，請從送單成功頁重新進入追蹤。'
    case 'NOT_FOUND':
      return '追蹤 API 路由不存在，請確認後端已部署最新 routes。'
    case 'INTERNAL_ERROR':
      return '後端發生內部錯誤，請檢查伺服器 log。'
    default:
      return code
        ? `目前無法載入訂單狀態（${code}），請稍後再試。`
        : '目前無法載入訂單狀態，請稍後再試。'
  }
}
