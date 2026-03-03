import { mockApiRequest } from '@project/api/mockRequest.js'

export async function loadCartPayload(tableCode) {
  return mockApiRequest('cart/get', { tableCode })
}

export async function addItemToCartSelection({ tableCode, cartId, menuItemId, customization }) {
  return mockApiRequest('cart/add-item', { tableCode, cartId, menuItemId, customization })
}

export async function changeCartItemQuantity({ tableCode, cartId, cartItemId, delta }) {
  return mockApiRequest('cart/change-item-quantity', { tableCode, cartId, cartItemId, delta })
}

export async function updateCartItemCustomization({ tableCode, cartId, cartItemId, customization }) {
  return mockApiRequest('cart/update-item', {
    tableCode,
    cartId,
    cartItemId,
    customization
  })
}
