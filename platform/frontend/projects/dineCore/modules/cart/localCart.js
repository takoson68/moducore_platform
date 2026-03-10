const STORAGE_PREFIX = 'dinecore.local-cart'

function canUseStorage() {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined'
}

function safeJsonParse(raw, fallback) {
  if (!raw) return fallback

  try {
    return JSON.parse(raw)
  } catch {
    return fallback
  }
}

export function buildLocalCartStorageKey(tableCode, orderingSessionToken) {
  return `${STORAGE_PREFIX}.${String(tableCode || '').trim().toUpperCase()}.${String(orderingSessionToken || '').trim()}`
}

export function createEmptyLocalCart({
  orderingSessionToken = '',
  orderingCartId = '',
  orderingLabel = '',
  personSlot = 0
} = {}) {
  return {
    orderingSessionToken: String(orderingSessionToken || ''),
    orderingCartId: String(orderingCartId || ''),
    orderingLabel: String(orderingLabel || ''),
    personSlot: Number(personSlot || 0),
    currentBatchId: '',
    currentBatchNo: 0,
    currentBatchStatus: '',
    carts: orderingCartId
      ? [
          {
            id: String(orderingCartId || ''),
            guestLabel: String(orderingLabel || ''),
            note: '',
            itemCount: 0,
            subtotal: 0
          }
        ]
      : [],
    cartItemsByCartId: orderingCartId ? { [orderingCartId]: [] } : {},
    itemSchemasByMenuItemId: {},
    participantCount: orderingCartId ? 1 : 0
  }
}

function normalizeCartItem(item = {}) {
  return {
    id: String(item.id || ''),
    menu_item_id: String(item.menu_item_id || ''),
    title: String(item.title || ''),
    quantity: Math.max(1, Number(item.quantity || 1)),
    price: Number(item.price || 0),
    note: String(item.note || ''),
    options: Array.isArray(item.options) ? [...item.options] : [],
    selected_option_ids: Array.isArray(item.selected_option_ids) ? [...item.selected_option_ids] : [],
    cart_id: String(item.cart_id || ''),
    editSchema: item.editSchema || null
  }
}

function summarizeCart(orderingCartId, orderingLabel, items) {
  const safeItems = Array.isArray(items) ? items : []
  const subtotal = safeItems.reduce(
    (sum, item) => sum + Number(item.price || 0) * Number(item.quantity || 0),
    0
  )
  const itemCount = safeItems.reduce((sum, item) => sum + Number(item.quantity || 0), 0)

  return {
    id: orderingCartId,
    guestLabel: orderingLabel,
    note: '',
    itemCount,
    subtotal
  }
}

export function normalizeLocalCartPayload(payload = {}, fallback = {}) {
  const orderingSessionToken = String(
    payload.orderingSessionToken || fallback.orderingSessionToken || ''
  )
  const orderingCartId = String(payload.orderingCartId || fallback.orderingCartId || '')
  const orderingLabel = String(payload.orderingLabel || fallback.orderingLabel || '')
  const personSlot = Number(payload.personSlot ?? fallback.personSlot ?? 0)
  const items = Array.isArray(payload.cartItemsByCartId?.[orderingCartId])
    ? payload.cartItemsByCartId[orderingCartId].map(normalizeCartItem)
    : Array.isArray(payload.items)
      ? payload.items.map(normalizeCartItem)
      : []
  const cartItemsByCartId = orderingCartId ? { [orderingCartId]: items } : {}
  const carts = orderingCartId ? [summarizeCart(orderingCartId, orderingLabel, items)] : []

  return {
    orderingSessionToken,
    orderingCartId,
    orderingLabel,
    personSlot,
    currentBatchId: String(payload.currentBatchId || fallback.currentBatchId || ''),
    currentBatchNo: Number(payload.currentBatchNo || fallback.currentBatchNo || 0),
    currentBatchStatus: String(payload.currentBatchStatus || fallback.currentBatchStatus || ''),
    participantCount: carts.length,
    carts,
    cartItemsByCartId,
    itemSchemasByMenuItemId: payload.itemSchemasByMenuItemId || fallback.itemSchemasByMenuItemId || {}
  }
}

export function loadLocalCartPayload({ tableCode, orderingSessionToken, fallback = {} }) {
  const empty = normalizeLocalCartPayload(createEmptyLocalCart(fallback), fallback)
  if (!canUseStorage() || !tableCode || !orderingSessionToken) {
    return empty
  }

  const raw = window.localStorage.getItem(
    buildLocalCartStorageKey(tableCode, orderingSessionToken)
  )

  return normalizeLocalCartPayload(safeJsonParse(raw, empty), fallback)
}

export function persistLocalCartPayload({ tableCode, orderingSessionToken, payload }) {
  if (!canUseStorage() || !tableCode || !orderingSessionToken) {
    return
  }

  const normalized = normalizeLocalCartPayload(payload, payload)
  window.localStorage.setItem(
    buildLocalCartStorageKey(tableCode, orderingSessionToken),
    JSON.stringify(normalized)
  )
}

export function clearLocalCartPayload({ tableCode, orderingSessionToken }) {
  if (!canUseStorage() || !tableCode || !orderingSessionToken) {
    return
  }

  window.localStorage.removeItem(buildLocalCartStorageKey(tableCode, orderingSessionToken))
}

export function buildCheckoutSummaryFromLocalCart(payload = {}) {
  const orderingCartId = String(payload.orderingCartId || '')
  const items = Array.isArray(payload.cartItemsByCartId?.[orderingCartId])
    ? payload.cartItemsByCartId[orderingCartId]
    : []
  const subtotal = items.reduce(
    (sum, item) => sum + Number(item.price || 0) * Number(item.quantity || 0),
    0
  )
  const serviceFee = Math.round(subtotal * 0.1)
  const tax = 0
  const itemCount = items.reduce((sum, item) => sum + Number(item.quantity || 0), 0)

  return {
    currentBatchId: String(payload.currentBatchId || ''),
    currentBatchNo: Number(payload.currentBatchNo || 0),
    currentBatchStatus: String(payload.currentBatchStatus || ''),
    itemCount,
    subtotal,
    serviceFee,
    tax,
    total: subtotal + serviceFee,
    paymentStatus: 'unpaid',
    persons: orderingCartId
      ? [
          {
            cartId: orderingCartId,
            guestLabel: String(payload.orderingLabel || ''),
            subtotal,
            total: subtotal + serviceFee,
            items
          }
        ]
      : []
  }
}

export function createLocalCartItemId() {
  return `local-item-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
}
