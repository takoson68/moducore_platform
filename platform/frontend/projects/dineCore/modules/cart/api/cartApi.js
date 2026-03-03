import { dineCoreRequest } from '@project/api/dineCoreRequest.js'

export function getCartPayload(tableCode, orderingSessionToken = '') {
  return dineCoreRequest('cart/get', {
    path: '/api/dinecore/carts',
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

export function addCartItem({
  tableCode,
  cartId,
  menuItemId,
  customization,
  orderingSessionToken = ''
}) {
  return dineCoreRequest('cart/add-item', {
    path: '/api/dinecore/cart/add-item',
    method: 'POST',
    mockPayload: {
      tableCode,
      cartId,
      menuItemId,
      customization,
      orderingSessionToken
    },
    body: {
      table_code: tableCode,
      cart_id: cartId,
      menuItemId,
      customization,
      ordering_session_token: orderingSessionToken
    }
  })
}

export function changeCartItem({
  tableCode,
  cartId,
  cartItemId,
  delta,
  orderingSessionToken = ''
}) {
  return dineCoreRequest('cart/change-item-quantity', {
    path: '/api/dinecore/cart/change-item-quantity',
    method: 'POST',
    mockPayload: {
      tableCode,
      cartId,
      cartItemId,
      delta,
      orderingSessionToken
    },
    body: {
      table_code: tableCode,
      cart_id: cartId,
      cart_item_id: cartItemId,
      delta,
      ordering_session_token: orderingSessionToken
    }
  })
}

export function updateCartItem({
  tableCode,
  cartId,
  cartItemId,
  customization,
  orderingSessionToken = ''
}) {
  return dineCoreRequest('cart/update-item', {
    path: '/api/dinecore/cart/update-item',
    method: 'POST',
    mockPayload: {
      tableCode,
      cartId,
      cartItemId,
      customization,
      orderingSessionToken
    },
    body: {
      table_code: tableCode,
      cart_id: cartId,
      cart_item_id: cartItemId,
      customization,
      ordering_session_token: orderingSessionToken
    }
  })
}
