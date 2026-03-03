import {
  addCartItem,
  changeCartItem,
  getCartPayload,
  updateCartItem
} from './api/cartApi.js'

export async function loadCartPayload(tableCode, orderingSessionToken = '') {
  return getCartPayload(tableCode, orderingSessionToken)
}

export async function addItemToCartSelection({
  tableCode,
  cartId,
  menuItemId,
  customization,
  orderingSessionToken = ''
}) {
  return addCartItem({
    tableCode,
    cartId,
    menuItemId,
    customization,
    orderingSessionToken
  })
}

export async function changeCartItemQuantity({
  tableCode,
  cartId,
  cartItemId,
  delta,
  orderingSessionToken = ''
}) {
  return changeCartItem({
    tableCode,
    cartId,
    cartItemId,
    delta,
    orderingSessionToken
  })
}

export async function updateCartItemCustomization({
  tableCode,
  cartId,
  cartItemId,
  customization,
  orderingSessionToken = ''
}) {
  return updateCartItem({
    tableCode,
    cartId,
    cartItemId,
    customization,
    orderingSessionToken
  })
}

export function mapCartError(error) {
  const code = String(error?.message || '')

  switch (code) {
    case 'CART_NOT_FOUND':
    case 'CART_ITEM_NOT_FOUND':
      return '找不到目前的購物車資料，系統將重新同步桌內內容。'
    case 'ORDER_NOT_FOUND':
      return '目前找不到這桌的進行中訂單，請重新進入桌號頁。'
    default:
      return '購物車同步失敗，請稍後再試。'
  }
}
