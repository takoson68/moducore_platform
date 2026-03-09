import {
  getCheckoutSuccess,
  submitCheckout
} from './api/checkoutApi.js'

export async function submitCheckoutOrder({
  tableCode,
  orderingSessionToken = '',
  clientSubmissionId = '',
  cart = {}
}) {
  return submitCheckout({
    tableCode,
    orderingSessionToken,
    clientSubmissionId,
    cart
  })
}

export async function loadCheckoutSuccessSummary(
  tableCode,
  orderId,
  submittedBatchNo = 0,
  orderingSessionToken = ''
) {
  return getCheckoutSuccess(tableCode, orderId, submittedBatchNo, orderingSessionToken)
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
