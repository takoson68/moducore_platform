import { computed } from 'vue'
import world from '@/world.js'
import {
  getGuestOrderingSessionToken,
  setGuestOrderingSessionToken
} from '@project/api/guestOrderingSession.js'

const defaultEntryState = {
  loading: false,
  errorMessage: '',
  tableCode: '',
  tableName: '',
  dineMode: 'dine_in',
  tableStatus: 'unknown',
  orderingEnabled: true,
  orderingSessionToken: '',
  orderingCartId: '',
  personSlot: 0,
  orderingLabel: '',
  orderId: '',
  orderNo: '',
  orderStatus: '',
  currentBatchId: '',
  currentBatchNo: 0,
  currentBatchStatus: ''
}

const defaultCartState = {
  orderingSessionToken: '',
  orderingCartId: '',
  orderingLabel: '',
  personSlot: 0,
  currentBatchId: '',
  currentBatchNo: 0,
  currentBatchStatus: '',
  carts: [],
  cartItemsByCartId: {},
  itemSchemasByMenuItemId: {},
  editor: null
}

const defaultMenuState = {
  categories: [],
  items: [],
  activeCategoryId: 'all',
  errorMessage: '',
  optionDraft: null
}

function safeStore(name) {
  return world.hasStore(name) ? world.store(name) : null
}

function getEntryStore() {
  return safeStore('dineCoreEntryStore')
}

function getCartStore() {
  return safeStore('dineCoreCartStore')
}

function getMenuStore() {
  return safeStore('dineCoreMenuStore')
}

function getCheckoutStore() {
  return safeStore('dineCoreCheckoutStore')
}

function getOrderTrackerStore() {
  return safeStore('dineCoreOrderTrackerStore')
}

function buildItemSchemaMap(items = []) {
  return Object.fromEntries(
    items
      .filter(item => item?.customization)
      .map(item => [item.id, item.customization])
  )
}

const entryState = computed(() => getEntryStore()?.state || defaultEntryState)
const cartState = computed(() => getCartStore()?.state || defaultCartState)
const menuState = computed(() => getMenuStore()?.state || defaultMenuState)
const checkoutState = computed(() => getCheckoutStore()?.state || {})
const trackerState = computed(() => getOrderTrackerStore()?.state || {})

const guestShellState = computed(() => {
  const carts = Array.isArray(cartState.value.carts) ? cartState.value.carts : []
  const cartItemCount = carts.reduce((sum, cart) => sum + Number(cart.itemCount || 0), 0)
  const orderStatus = String(entryState.value.orderStatus || '').trim().toLowerCase()

  return {
    cartItemCount,
    orderId: String(entryState.value.orderId || '').trim(),
    orderNo: String(entryState.value.orderNo || '').trim(),
    orderStatus,
    canTrackOrder: Boolean(entryState.value.orderId) && orderStatus !== 'draft',
    categories: Array.isArray(menuState.value.categories) ? menuState.value.categories : [],
    activeCategoryId: menuState.value.activeCategoryId || 'all'
  }
})

function resolveOrderingSessionToken(tableCode, queryToken = '') {
  const normalizedTableCode = String(tableCode || '').trim().toUpperCase()
  return String(
    entryState.value.orderingSessionToken ||
    queryToken ||
    getGuestOrderingSessionToken(normalizedTableCode) ||
    ''
  ).trim()
}

function syncCartFromEntry(tableCode) {
  const cartStore = getCartStore()
  if (!cartStore) return

  cartStore.loadFromEntry({
    tableCode,
    orderingSessionToken: entryState.value.orderingSessionToken,
    orderingCartId: entryState.value.orderingCartId,
    orderingLabel: entryState.value.orderingLabel,
    personSlot: entryState.value.personSlot
  })
}

async function ensureEntryContext(tableCode, orderingSessionToken = '') {
  const entryStore = getEntryStore()
  if (!entryStore) return null

  await entryStore.loadTableContext({
    tableCode,
    orderingSessionToken: orderingSessionToken || resolveOrderingSessionToken(tableCode)
  })

  syncCartFromEntry(tableCode)
  return entryStore.state
}

async function revalidateEntryContext(tableCode) {
  return ensureEntryContext(tableCode, entryState.value.orderingSessionToken)
}

async function ensureMenuFlow(tableCode) {
  const menuStore = getMenuStore()
  const cartStore = getCartStore()
  if (!menuStore) return null

  const orderingSessionToken = resolveOrderingSessionToken(tableCode)
  if (!orderingSessionToken) return null

  const payload = await menuStore.load({
    tableCode,
    orderingSessionToken
  })

  if (cartStore) {
    cartStore.setItemSchemas(buildItemSchemaMap(payload?.items || []))
    syncCartFromEntry(tableCode)
  }

  return payload
}

function setGuestMenuCategory(categoryId) {
  getMenuStore()?.setActiveCategory(categoryId)
}

function addMenuItemToOrderingCart({ tableCode, menuItemId, customization }) {
  getCartStore()?.addMenuItemToOrderingCart({
    tableCode,
    menuItemId,
    customization
  })
}

function loadCheckout(tableCode) {
  const checkoutStore = getCheckoutStore()
  if (!checkoutStore) return

  syncCartFromEntry(tableCode)
  checkoutStore.load({
    tableCode,
    orderingSessionToken: resolveOrderingSessionToken(tableCode),
    cartState: cartState.value
  })
}

async function submitCheckout(tableCode) {
  const checkoutStore = getCheckoutStore()
  const entryStore = getEntryStore()
  const cartStore = getCartStore()
  if (!checkoutStore) return null

  const result = await checkoutStore.submit({
    tableCode,
    orderingSessionToken: resolveOrderingSessionToken(tableCode),
    cartState: cartState.value
  })

  entryStore?.setTableContext({
    tableCode,
    orderId: String(result.orderId || ''),
    orderNo: String(result.orderNo || ''),
    orderStatus: String(result.orderStatus || 'pending'),
    currentBatchId: String(result.nextBatchId || ''),
    currentBatchNo: Number(result.nextBatchNo || 0),
    currentBatchStatus: 'draft'
  })

  cartStore?.clearForSubmittedOrder({
    tableCode,
    orderingSessionToken: resolveOrderingSessionToken(tableCode),
    nextBatchId: String(result.nextBatchId || ''),
    nextBatchNo: Number(result.nextBatchNo || 0)
  })

  return result
}

async function loadOrderTracker({ tableCode, orderId, queryToken = '' }) {
  const trackerStore = getOrderTrackerStore()
  if (!trackerStore) return

  const orderingSessionToken = resolveOrderingSessionToken(tableCode, queryToken)
  if (orderingSessionToken) {
    setGuestOrderingSessionToken(tableCode, orderingSessionToken)
  }

  await trackerStore.load({
    tableCode,
    orderId,
    orderingSessionToken
  })
}

export function useDineCoreOrderingFlow() {
  return {
    entryState,
    cartState,
    menuState,
    checkoutState,
    trackerState,
    guestShellState,
    resolveOrderingSessionToken,
    ensureEntryContext,
    revalidateEntryContext,
    ensureMenuFlow,
    syncCartFromEntry,
    setGuestMenuCategory,
    addMenuItemToOrderingCart,
    loadCheckout,
    submitCheckout,
    loadOrderTracker
  }
}
