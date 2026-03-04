import {
  getCheckoutSuccess,
  getCheckoutSummary,
  submitCheckout
} from './api/checkoutApi.js'

export async function loadCheckoutSummary(tableCode, orderingSessionToken = '') {
  return getCheckoutSummary(tableCode, orderingSessionToken)
}

export async function submitCheckoutOrder(tableCode, orderingSessionToken = '') {
  return submitCheckout(tableCode, orderingSessionToken)
}

export async function loadCheckoutSuccessSummary(orderId, submittedBatchNo = 0) {
  return getCheckoutSuccess(orderId, submittedBatchNo)
}

export function mapCheckoutError(error) {
  const code = String(error?.message || '')

  switch (code) {
    case 'ORDER_NOT_FOUND':
      return '目前找不到這桌的進行中訂單，請先回到購物車重新確認。'
    default:
      return '確認訂單失敗，請稍後再試。'
  }
}
