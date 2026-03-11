import {
  cloneMockValue,
  ensureMockTable,
  readMockState,
  waitForMock,
  writeMockState
} from './mockRuntime.js'
import {
  getGuestOrderingSessionToken,
  setGuestOrderingSessionToken
} from './guestOrderingSession.js'

function getCartBucket(state, tableCode) {
  ensureMockTable(state, tableCode)

  if (!state.cartsByTable[tableCode]) {
    state.cartsByTable[tableCode] = {
      carts: [],
      itemsByCartId: {}
    }
  }

  return state.cartsByTable[tableCode]
}

function getGuestOrderingSessionBucket(state, tableCode) {
  ensureMockTable(state, tableCode)

  if (!state.guestOrderingSessionsByTable[tableCode]) {
    state.guestOrderingSessionsByTable[tableCode] = {}
  }

  return state.guestOrderingSessionsByTable[tableCode]
}

function getActiveOrderingBucket(state) {
  if (!state.activeOrderingByTable) {
    state.activeOrderingByTable = {}
  }

  return state.activeOrderingByTable
}

function buildGuestCartId(slot) {
  return `guest-${String.fromCharCode(96 + Number(slot || 1))}`
}

function buildGuestDisplayLabel(slot) {
  return `${slot}號顧客`
}

function isOrderSettled(order) {
  if (!order) return true

  return order.payment_status === 'paid' || order.order_status === 'cancelled'
}

function findOpenOrderForTable(state, tableCode) {
  return state.orders.find(order => order.table_code === tableCode && !isOrderSettled(order)) || null
}

function ensureGuestCartForSlot(state, tableCode, slot) {
  const bucket = getCartBucket(state, tableCode)
  const cartId = buildGuestCartId(slot)
  const existing = bucket.carts.find(cart => cart.id === cartId)

  if (existing) {
    existing.guest_label = existing.guest_label || buildGuestDisplayLabel(slot)
    bucket.itemsByCartId[cartId] = bucket.itemsByCartId[cartId] || []
    return existing
  }

  const created = {
    id: cartId,
    guest_label: buildGuestDisplayLabel(slot),
    note: ''
  }

  bucket.carts.push(created)
  bucket.itemsByCartId[cartId] = bucket.itemsByCartId[cartId] || []
  return created
}

function getOrCreateActiveOrderingContext(state, tableCode) {
  const bucket = getActiveOrderingBucket(state)
  const current = bucket[tableCode]
  const currentOrder = current
    ? state.orders.find(order => order.id === current.order_id || order.order_no === current.order_no)
    : null

  if (current && (!currentOrder || !isOrderSettled(currentOrder))) {
    return current
  }

  const openOrder = findOpenOrderForTable(state, tableCode)
  if (openOrder) {
    bucket[tableCode] = {
      order_id: openOrder.id,
      order_no: openOrder.order_no,
      status: 'open',
      created_at: openOrder.created_at
    }
    return bucket[tableCode]
  }

  const { id, orderNo } = createOrderIdentifiers(state)
  bucket[tableCode] = {
    order_id: id,
    order_no: orderNo,
    status: 'draft',
    created_at: '2026-03-03 22:40:00'
  }

  return bucket[tableCode]
}

function createGuestOrderingSession(state, tableCode, orderingContext) {
  const sessionBucket = getGuestOrderingSessionBucket(state, tableCode)
  const activeSlots = Object.values(sessionBucket)
    .filter(session => session.status !== 'expired')
    .filter(session => session.order_id === orderingContext.order_id)
    .map(session => Number(session.person_slot || 0))
  const nextSlot = activeSlots.length > 0 ? Math.max(...activeSlots) + 1 : 1
  const cart = ensureGuestCartForSlot(state, tableCode, nextSlot)
  const token = `guest-session-${tableCode.toLowerCase()}-${state.nextIds.guestSession}`

  state.nextIds.guestSession += 1

  const session = {
    id: token,
    table_code: tableCode,
    session_token: token,
    order_id: orderingContext.order_id,
    order_no: orderingContext.order_no,
    person_slot: nextSlot,
    cart_id: cart.id,
    display_label: cart.guest_label || buildGuestDisplayLabel(nextSlot),
    status: 'active',
    created_at: '2026-03-03 22:40:00',
    last_seen_at: '2026-03-03 22:40:00'
  }

  sessionBucket[token] = session
  return session
}

function getOrCreateGuestOrderingSession(state, tableCode, orderingSessionToken) {
  const orderingContext = getOrCreateActiveOrderingContext(state, tableCode)
  const sessionBucket = getGuestOrderingSessionBucket(state, tableCode)
  const safeToken = String(orderingSessionToken || '').trim()
  const existing = safeToken ? sessionBucket[safeToken] : null

  if (existing && existing.order_id === orderingContext.order_id) {
    existing.last_seen_at = '2026-03-03 22:40:00'
    existing.status = 'active'
    ensureGuestCartForSlot(state, tableCode, existing.person_slot)
    return existing
  }

  return createGuestOrderingSession(state, tableCode, orderingContext)
}

function findMenuItem(state, menuItemId) {
  const menuItem = state.items.find(item => item.id === menuItemId && !item.hidden)
  if (!menuItem) {
    throw new Error('MENU_ITEM_NOT_FOUND')
  }

  return menuItem
}

function buildOptionLookup(optionGroups = []) {
  return optionGroups.reduce((lookup, group) => {
    group.options.forEach(option => {
      lookup[option.id] = {
        ...option,
        group_id: group.id,
        group_label: group.label,
        group_type: group.type
      }
    })
    return lookup
  }, {})
}

function buildMenuItemSchema(menuItem) {
  return {
    id: menuItem.id,
    title: menuItem.name,
    basePrice: menuItem.base_price,
    defaultNote: menuItem.default_note || '',
    defaultOptionIds: cloneMockValue(menuItem.default_option_ids || []),
    optionGroups: cloneMockValue(
      (menuItem.option_groups || []).map(group => ({
        id: group.id,
        label: group.label,
        type: group.type,
        required: Boolean(group.required),
        options: group.options.map(option => ({
          id: option.id,
          label: option.label,
          priceDelta: Number(option.price_delta || 0)
        }))
      }))
    )
  }
}

function normalizeSelectedOptionIds(optionGroups = [], selectedOptionIds = []) {
  const lookup = buildOptionLookup(optionGroups)
  const safeIds = Array.isArray(selectedOptionIds) ? selectedOptionIds.filter(id => lookup[id]) : []

  const byGroup = optionGroups.reduce((accumulator, group) => {
    accumulator[group.id] = []
    return accumulator
  }, {})

  safeIds.forEach(optionId => {
    const option = lookup[optionId]
    if (!option) return

    if (option.group_type === 'single') {
      byGroup[option.group_id] = [optionId]
      return
    }

    byGroup[option.group_id].push(optionId)
  })

  optionGroups.forEach(group => {
    if (group.type === 'single' && byGroup[group.id].length === 0) {
      const defaultOption = group.options[0]
      if (defaultOption) {
        byGroup[group.id] = [defaultOption.id]
      }
    }
  })

  return optionGroups.flatMap(group => byGroup[group.id])
}

function resolveCustomization(menuItem, payload = {}) {
  const optionGroups = menuItem.option_groups || []
  const selectedOptionIds = normalizeSelectedOptionIds(
    optionGroups,
    payload.selectedOptionIds?.length ? payload.selectedOptionIds : menuItem.default_option_ids || []
  )
  const optionLookup = buildOptionLookup(optionGroups)
  const selectedOptions = selectedOptionIds.map(optionId => optionLookup[optionId]).filter(Boolean)
  const extraPrice = selectedOptions.reduce(
    (sum, option) => sum + Number(option.price_delta || 0),
    0
  )

  return {
    note: String(payload.note ?? menuItem.default_note ?? '').trim(),
    selectedOptionIds,
    options: selectedOptions.map(option => option.label),
    price: Number(menuItem.base_price || 0) + extraPrice
  }
}

function buildCartItemEditSchema(menuItem, cartItem) {
  const schema = buildMenuItemSchema(menuItem)

  return {
    ...schema,
    note: cartItem.note || '',
    selectedOptionIds: cloneMockValue(cartItem.selected_option_ids || [])
  }
}

function buildItemSchemasByMenuItemId(state) {
  return state.items.reduce((lookup, menuItem) => {
    lookup[menuItem.id] = buildMenuItemSchema(menuItem)
    return lookup
  }, {})
}

function buildDashboardMenuItems(state) {
  const categoryNameById = state.categories.reduce((lookup, category) => {
    lookup[category.id] = category.name
    return lookup
  }, {})

  return state.items.map(item => ({
    id: item.id,
    title: item.name,
    categoryId: item.category_id,
    categoryName: categoryNameById[item.category_id] || item.category_id,
    description: item.description || '',
    price: Number(item.base_price || 0),
    imageUrl: item.image_url || '',
    defaultOptionIds: cloneMockValue(item.default_option_ids || []),
    optionGroups: cloneMockValue(
      (item.option_groups || []).map(group => ({
        id: group.id,
        label: group.label,
        type: group.type,
        required: Boolean(group.required),
        options: (group.options || []).map(option => ({
          id: option.id,
          label: option.label,
          priceDelta: Number(option.price_delta || 0)
        }))
      }))
    ),
    soldOut: Boolean(item.sold_out),
    hidden: Boolean(item.hidden)
  }))
}

function buildMenuAdminCategories(state) {
  return [...state.categories]
    .sort((left, right) => Number(left.sort_order || 0) - Number(right.sort_order || 0))
    .map(category => ({
      id: category.id,
      name: category.name,
      sortOrder: Number(category.sort_order || 0)
    }))
}

function createMenuItemId(state) {
  const nextId = String(state.nextIds.menuItem || 1).padStart(3, '0')
  state.nextIds.menuItem = Number(nextId) + 1
  return `custom-item-${nextId}`
}

function createCategoryId(state) {
  const nextId = String(state.nextIds.category || 1).padStart(3, '0')
  state.nextIds.category = Number(nextId) + 1
  return `custom-category-${nextId}`
}

function createTableId(state) {
  const nextId = String(state.nextIds.table || 1).padStart(3, '0')
  state.nextIds.table = Number(nextId) + 1
  return `tbl_custom_${nextId}`
}

function createOptionGroupId(state) {
  const nextId = String(state.nextIds.optionGroup || 1).padStart(3, '0')
  state.nextIds.optionGroup = Number(nextId) + 1
  return `custom-group-${nextId}`
}

function createOptionId(state) {
  const nextId = String(state.nextIds.option || 1).padStart(3, '0')
  state.nextIds.option = Number(nextId) + 1
  return `custom-option-${nextId}`
}

function normalizeAdminDefaultOptionIds(optionGroups = [], selectedOptionIds = []) {
  const optionLookup = buildOptionLookup(optionGroups)
  const safeSelectedOptionIds = Array.isArray(selectedOptionIds)
    ? selectedOptionIds.filter(optionId => optionLookup[optionId])
    : []

  return optionGroups.flatMap(group => {
    const selectedIdsInGroup = group.options
      .map(option => option.id)
      .filter(optionId => safeSelectedOptionIds.includes(optionId))

    if (group.type === 'single') {
      return selectedIdsInGroup.slice(0, 1)
    }

    return selectedIdsInGroup
  })
}

function buildTableAdminTables(state) {
  return Object.values(state.tables)
    .sort((left, right) => Number(left.sort_order || 0) - Number(right.sort_order || 0))
    .map(table => ({
      id: table.id,
      code: table.code,
      name: table.name,
      areaName: table.area_name,
      dineMode: table.dine_mode,
      status: table.status,
      orderingEnabled: Boolean(table.is_ordering_enabled),
      sortOrder: Number(table.sort_order || 0)
    }))
}

function summarizeCart(cart, items = []) {
  const subtotal = items.reduce(
    (sum, item) => sum + Number(item.price || 0) * Number(item.quantity || 1),
    0
  )
  const itemCount = items.reduce((sum, item) => sum + Number(item.quantity || 1), 0)

  return {
    id: cart.id,
    guestLabel: cart.guest_label,
    note: cart.note,
    itemCount,
    subtotal
  }
}

function buildCartPayload(state, tableCode, orderingSession = null) {
  const bucket = getCartBucket(state, tableCode)
  const itemSchemasByMenuItemId = buildItemSchemasByMenuItemId(state)
  const resolvedOrderingSession =
    orderingSession || getOrCreateGuestOrderingSession(state, tableCode)
  const cartItemsByCartId = Object.fromEntries(
    Object.entries(bucket.itemsByCartId).map(([cartId, items]) => [
      cartId,
      items.map(item => {
        const menuItem = state.items.find(entry => entry.id === item.menu_item_id)
        return {
          ...cloneMockValue(item),
          cart_id: cartId,
          editSchema: menuItem ? buildCartItemEditSchema(menuItem, item) : null
        }
      })
    ])
  )

  return {
    orderingSessionToken: resolvedOrderingSession.session_token,
    orderingCartId: resolvedOrderingSession.cart_id,
    personSlot: Number(resolvedOrderingSession.person_slot || 0),
    orderingLabel: resolvedOrderingSession.display_label || '',
    carts: bucket.carts.map(cart => summarizeCart(cart, bucket.itemsByCartId[cart.id] || [])),
    cartItemsByCartId,
    itemSchemasByMenuItemId
  }
}

function buildCheckoutSummary(state, tableCode) {
  const bucket = getCartBucket(state, tableCode)
  const orderingContext = getOrCreateActiveOrderingContext(state, tableCode)
  const sessionByCartId = Object.values(getGuestOrderingSessionBucket(state, tableCode))
    .filter(session => session.order_id === orderingContext.order_id)
    .reduce((lookup, session) => {
      lookup[session.cart_id] = session
      return lookup
    }, {})
  const persons = bucket.carts.map(cart => {
    const personItems = (bucket.itemsByCartId[cart.id] || []).map(item => ({
      id: item.id,
      title: item.title,
      quantity: item.quantity,
      price: item.price,
      note: item.note,
      options: cloneMockValue(item.options || [])
    }))
    const summary = summarizeCart(cart, bucket.itemsByCartId[cart.id] || [])
    const personServiceFee = Math.round(summary.subtotal * 0.1)
    const personTax = 0
    const session = sessionByCartId[cart.id]

    return {
      cartId: summary.id,
      personSlot: Number(session?.person_slot || 0),
      guestLabel: summary.guestLabel,
      subtotal: summary.subtotal,
      total: summary.subtotal + personServiceFee,
      items: personItems
    }
  })

  const subtotal = persons.reduce((sum, person) => sum + person.subtotal, 0)
  const serviceFee = Math.round(subtotal * 0.1)
  const tax = 0

  return {
    subtotal,
    serviceFee,
    tax,
    total: subtotal + serviceFee,
    persons,
    paymentMethods: [
      { id: 'cash', label: '櫃台現金付款', description: '由櫃台人工確認現金收款。' },
      { id: 'counter-card', label: '櫃台刷卡付款', description: '由店員協助完成刷卡付款。' }
    ]
  }
}

function createOrderIdentifiers(state) {
  const sequence = String(state.nextIds.order).padStart(3, '0')
  state.nextIds.order += 1

  return {
    id: `ord_${sequence}`,
    orderNo: `DC20260303${sequence}`
  }
}

function collectOrderItems(state, order) {
  const bucket = state.cartsByTable[order.table_code]

  return order.persons.flatMap(person => {
    const cartItems = bucket?.itemsByCartId?.[person.cart_id] || []

    return cartItems.map(item => ({
      id: item.id,
      title: item.title,
      quantity: item.quantity,
      price: item.price,
      note: item.note,
      options: cloneMockValue(item.options || []),
      guestLabel: person.guest_label
    }))
  })
}

function collectOrderPersons(state, order) {
  const bucket = state.cartsByTable[order.table_code]

  return order.persons.map(person => ({
    cartId: person.cart_id,
    guestLabel: person.guest_label,
    subtotal: person.subtotal,
    total: person.total,
    items: (bucket?.itemsByCartId?.[person.cart_id] || []).map(item => ({
      id: item.id,
      title: item.title,
      quantity: item.quantity,
      price: item.price,
      note: item.note,
      options: cloneMockValue(item.options || [])
    }))
  }))
}

function updateOrderRecord(state, orderId, updater) {
  const order = state.orders.find(entry => entry.id === orderId)
  if (!order) {
    throw new Error('ORDER_NOT_FOUND')
  }

  assertBusinessDateUnlocked(state, getBusinessDate(order.created_at))

  updater(order)
  return order
}

function appendTimeline(order, status, source, note) {
  const now = '2026-03-03 22:40:00'
  order.timeline.push({
    status,
    changed_at: now,
    source,
    note
  })
}

function normalizePaymentMethod(order) {
  if (order.payment_method) return order.payment_method
  if (order.payment_status === 'paid') return 'cash'
  return 'unpaid'
}

function getBusinessDate(dateTime = '') {
  return String(dateTime || '').split(' ')[0] || ''
}

function createAuditCloseId(state) {
  const nextId = String(state.nextIds.auditClose || 1).padStart(3, '0')
  state.nextIds.auditClose = Number(nextId) + 1
  return `audit-close-${nextId}`
}

function ensureStaffSession(state) {
  if (!state.staffSession) {
    throw new Error('STAFF_SESSION_REQUIRED')
  }

  return state.staffSession
}

function ensureManagerSession(state) {
  const session = ensureStaffSession(state)
  if (session.role !== 'manager') {
    throw new Error('STAFF_ROLE_FORBIDDEN')
  }

  return session
}

function findClosingRecord(state, businessDate) {
  return state.auditClosings?.[businessDate] || null
}

function isBusinessDateLocked(state, businessDate) {
  return findClosingRecord(state, businessDate)?.status === 'closed'
}

function assertBusinessDateUnlocked(state, businessDate) {
  if (isBusinessDateLocked(state, businessDate)) {
    throw new Error('BUSINESS_DATE_LOCKED')
  }
}

function buildAuditBlockingIssues(orders = []) {
  const unpaidOrders = orders.filter(order => order.payment_status !== 'paid')
  const unfinishedOrders = orders.filter(order =>
    order.order_status === 'pending' ||
    order.order_status === 'preparing' ||
    order.order_status === 'ready'
  )

  return [
    {
      type: 'unpaid_orders',
      label: '仍有未付款訂單',
      count: unpaidOrders.length,
      orderIds: unpaidOrders.map(order => order.id)
    },
    {
      type: 'unfinished_orders',
      label: '仍有未完成訂單',
      count: unfinishedOrders.length,
      orderIds: unfinishedOrders.map(order => order.id)
    }
  ].filter(issue => issue.count > 0)
}

function buildAuditSummary(state, businessDate) {
  const selectedOrders = state.orders.filter(order => getBusinessDate(order.created_at) === businessDate)
  const closing = findClosingRecord(state, businessDate)
  const grossSales = selectedOrders.reduce((sum, order) => sum + Number(order.total_amount || 0), 0)
  const paidAmount = selectedOrders
    .filter(order => order.payment_status === 'paid')
    .reduce((sum, order) => sum + Number(order.total_amount || 0), 0)
  const unpaidAmount = selectedOrders
    .filter(order => order.payment_status !== 'paid')
    .reduce((sum, order) => sum + Number(order.total_amount || 0), 0)
  const blockingIssues = buildAuditBlockingIssues(selectedOrders)

  return {
    closingSummary: {
      businessDate,
      grossSales,
      paidAmount,
      unpaidAmount,
      orderCount: selectedOrders.length,
      unfinishedOrderCount: selectedOrders.filter(order =>
        order.order_status === 'pending' ||
        order.order_status === 'preparing' ||
        order.order_status === 'ready'
      ).length,
      closeStatus: closing?.status || 'open',
      closedAt: closing?.closed_at || '',
      closedBy: closing?.closed_by_name || ''
    },
    blockingIssues,
    lockState: {
      businessDate,
      isLocked: closing?.status === 'closed',
      lockedScopes: closing?.locked_scopes || []
    }
  }
}

function appendAuditHistory(state, payload = {}) {
  state.auditHistory.unshift({
    id: createAuditCloseId(state),
    business_date: payload.businessDate,
    action: payload.action,
    actor_name: payload.actorName,
    actor_role: payload.actorRole,
    created_at: payload.createdAt || '2026-03-03 23:10:00',
    reason: payload.reason || '',
    reason_type: payload.reasonType || 'general',
    affected_scopes: Array.isArray(payload.affectedScopes) ? payload.affectedScopes : [],
    before_status: payload.beforeStatus || '',
    after_status: payload.afterStatus || ''
  })
}

function normalizeVisitorStatsRange(range) {
  const safeRange = String(range || '').trim()
  return safeRange === '7d' || safeRange === '30d' ? safeRange : 'today'
}

function normalizeVisitorStatsPath(pathLike) {
  const raw = String(pathLike || '').trim()
  if (!raw) return '/'

  let normalized = raw.split('?')[0] || '/'
  if (!normalized.startsWith('/')) {
    normalized = `/${normalized}`
  }
  if (normalized !== '/' && normalized.endsWith('/')) {
    normalized = normalized.slice(0, -1)
  }

  return normalized || '/'
}

function resolveMockVisitorSourceTag(search = '') {
  const params = new URLSearchParams(String(search || '').replace(/^\?/, ''))
  return params.get('k') === '9d2f' ? 'tagged' : 'direct'
}

function resolveMockVisitorRangeStart(range) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  if (range === '7d') {
    today.setDate(today.getDate() - 6)
  } else if (range === '30d') {
    today.setDate(today.getDate() - 29)
  }

  return today
}

const handlers = {
  async 'entry/context'({ tableCode, orderingSessionToken }) {
    await waitForMock()
    return writeMockState(state => {
      const table = ensureMockTable(state, tableCode)
      const orderingContext = getOrCreateActiveOrderingContext(state, tableCode)
      const orderingSession = getOrCreateGuestOrderingSession(state, tableCode, orderingSessionToken)

      return cloneMockValue({
        ...table,
        ordering_session_token: orderingSession.session_token,
        ordering_cart_id: orderingSession.cart_id,
        person_slot: Number(orderingSession.person_slot || 0),
        ordering_label: orderingSession.display_label || '',
        order_id: orderingContext.order_id || '',
        order_no: orderingContext.order_no || '',
        order_status: orderingContext.status || 'draft'
      })
    })
  },
  async 'staff-auth/session'() {
    await waitForMock()

    return readMockState(state =>
      cloneMockValue({
        session: state.staffSession
      })
    )
  },
  async 'staff-auth/login'({ account, password }) {
    await waitForMock()

    return writeMockState(state => {
      const safeAccount = String(account || '').trim()
      const safePassword = String(password || '').trim()
      const staffUser = state.staffUsers.find(
        user => user.account === safeAccount && user.password === safePassword
      )

      if (!staffUser) {
        throw new Error('STAFF_LOGIN_FAILED')
      }

      state.staffSession = {
        id: staffUser.id,
        account: staffUser.account,
        name: staffUser.name,
        role: staffUser.role,
        isSuperAdmin: Boolean(staffUser.isSuperAdmin)
      }

      return cloneMockValue({
        session: state.staffSession
      })
    })
  },
  async 'staff-auth/logout'() {
    await waitForMock()

    return writeMockState(state => {
      state.staffSession = null

      return {
        ok: true
      }
    })
  },
  async 'visitor-stats/track'({ path = '/', search = '' }) {
    await waitForMock()

    return writeMockState(state => {
      const today = new Date().toISOString().slice(0, 10)
      const safePath = normalizeVisitorStatsPath(path)
      const sourceTag = resolveMockVisitorSourceTag(search)
      const ipAddress = '127.0.0.1'
      const now = new Date().toISOString().slice(0, 19).replace('T', ' ')

      state.visitorStatsDaily ||= []

      const existing = state.visitorStatsDaily.find(
        row =>
          row.visit_date === today &&
          row.ip_address === ipAddress &&
          row.path === safePath &&
          row.source_tag === sourceTag
      )

      if (existing) {
        existing.visit_count = Number(existing.visit_count || 0) + 1
        existing.last_visited_at = now
      } else {
        state.visitorStatsDaily.push({
          visit_date: today,
          ip_address: ipAddress,
          path: safePath,
          source_tag: sourceTag,
          visit_count: 1,
          first_visited_at: now,
          last_visited_at: now
        })
      }

      return cloneMockValue({
        visitDate: today,
        path: safePath,
        sourceTag: sourceTag
      })
    })
  },
  async 'visitor-stats/list'({ range = 'today' }) {
    await waitForMock()

    return readMockState(state => {
      const session = ensureStaffSession(state)
      if (!session.isSuperAdmin) {
        throw new Error('STAFF_ROLE_FORBIDDEN')
      }

      const safeRange = normalizeVisitorStatsRange(range)
      const startDate = resolveMockVisitorRangeStart(safeRange)
      const rows = (state.visitorStatsDaily || [])
        .filter(row => new Date(`${row.visit_date}T00:00:00`) >= startDate)
        .sort((left, right) => {
          if (left.visit_date !== right.visit_date) {
            return right.visit_date.localeCompare(left.visit_date)
          }

          return String(right.last_visited_at || '').localeCompare(String(left.last_visited_at || ''))
        })
        .map(row => ({
          visitDate: row.visit_date,
          ipAddress: row.ip_address,
          path: row.path,
          sourceTag: row.source_tag === 'tagged' ? 'tagged' : 'direct',
          visitCount: Number(row.visit_count || 0),
          firstVisitedAt: row.first_visited_at || '',
          lastVisitedAt: row.last_visited_at || ''
        }))

      return cloneMockValue({
        range: safeRange,
        rows
      })
    })
  },
  async 'menu/list'({ tableCode, orderingSessionToken }) {
    await waitForMock()

    return readMockState(state => {
      ensureMockTable(state, tableCode)
      getOrCreateGuestOrderingSession(state, tableCode, orderingSessionToken)

      return {
        categories: cloneMockValue(
          [...state.categories].sort(
            (left, right) => Number(left.sort_order || 0) - Number(right.sort_order || 0)
          )
        ),
        items: cloneMockValue(
          state.items
            .filter(item => !item.hidden)
            .map(item => ({
              id: item.id,
              categoryId: item.category_id,
              title: item.name,
              subtitle: item.description,
              price: item.base_price,
              imageUrl: item.image_url || '',
              soldOut: item.sold_out,
              badge: item.badge,
              tone: item.tone,
              tags: item.tags,
              customization: buildMenuItemSchema(item)
            }))
        )
      }
    })
  },
  async 'cart/get'({ tableCode, orderingSessionToken }) {
    await waitForMock()

    return writeMockState(state => {
      const orderingSession = getOrCreateGuestOrderingSession(state, tableCode, orderingSessionToken)
      const payload = buildCartPayload(state, tableCode, orderingSession)

      return {
        ...payload,
        orderingSessionToken: orderingSession.session_token,
        orderingCartId: orderingSession.cart_id,
        personSlot: Number(orderingSession.person_slot || 0),
        orderingLabel: orderingSession.display_label || ''
      }
    })
  },
  async 'cart/add-item'({ tableCode, cartId, menuItemId, customization, orderingSessionToken }) {
    await waitForMock()

    return writeMockState(state => {
      const bucket = getCartBucket(state, tableCode)
      const orderingSession = getOrCreateGuestOrderingSession(state, tableCode, orderingSessionToken)
      const menuItem = findMenuItem(state, menuItemId)
      const resolved = resolveCustomization(menuItem, customization)
      const nextId = `cart-item-${state.nextIds.cartItem}`
      const targetCartId = orderingSession.cart_id || cartId

      state.nextIds.cartItem += 1

      if (!bucket.itemsByCartId[targetCartId]) {
        bucket.itemsByCartId[targetCartId] = []
      }

      bucket.itemsByCartId[targetCartId].push({
        id: nextId,
        menu_item_id: menuItem.id,
        title: menuItem.name,
        quantity: 1,
        price: resolved.price,
        note: resolved.note,
        options: resolved.options,
        selected_option_ids: resolved.selectedOptionIds
      })

      return {
        ...buildCartPayload(state, tableCode, orderingSession),
        orderingSessionToken: orderingSession.session_token,
        orderingCartId: orderingSession.cart_id,
        personSlot: Number(orderingSession.person_slot || 0),
        orderingLabel: orderingSession.display_label || ''
      }
    })
  },
  async 'cart/change-item-quantity'({ tableCode, cartId, cartItemId, delta, orderingSessionToken }) {
    await waitForMock()

    return writeMockState(state => {
      const orderingSession = getOrCreateGuestOrderingSession(state, tableCode, orderingSessionToken)
      const bucket = getCartBucket(state, tableCode)
      const items = bucket.itemsByCartId[cartId] || []
      const target = items.find(item => item.id === cartItemId)

      if (target) {
        target.quantity += delta
        if (target.quantity <= 0) {
          bucket.itemsByCartId[cartId] = items.filter(item => item.id !== cartItemId)
        }
      }

      return buildCartPayload(state, tableCode, orderingSession)
    })
  },
  async 'cart/update-item'({ tableCode, cartId, cartItemId, customization, orderingSessionToken }) {
    await waitForMock()

    return writeMockState(state => {
      const orderingSession = getOrCreateGuestOrderingSession(state, tableCode, orderingSessionToken)
      const bucket = getCartBucket(state, tableCode)
      const items = bucket.itemsByCartId[cartId] || []
      const target = items.find(item => item.id === cartItemId)

      if (!target) {
        throw new Error('CART_ITEM_NOT_FOUND')
      }

      const menuItem = findMenuItem(state, target.menu_item_id)
      const resolved = resolveCustomization(menuItem, customization)

      target.price = resolved.price
      target.note = resolved.note
      target.options = resolved.options
      target.selected_option_ids = resolved.selectedOptionIds

      return buildCartPayload(state, tableCode, orderingSession)
    })
  },
  async 'checkout/summary'({ tableCode, orderingSessionToken }) {
    await waitForMock()
    return readMockState(state => {
      getOrCreateGuestOrderingSession(state, tableCode, orderingSessionToken)
      return buildCheckoutSummary(state, tableCode)
    })
  },
  async 'checkout/submit'({ tableCode, orderingSessionToken }) {
    await waitForMock(180)

    return writeMockState(state => {
      ensureMockTable(state, tableCode)
      getOrCreateGuestOrderingSession(state, tableCode, orderingSessionToken)
      const orderingContext = getOrCreateActiveOrderingContext(state, tableCode)
      const summary = buildCheckoutSummary(state, tableCode)
      const now = '2026-03-03 22:30:00'
      const existingOrder = state.orders.find(
        order => order.id === orderingContext.order_id || order.order_no === orderingContext.order_no
      )

      const nextPayload = {
        id: orderingContext.order_id,
        order_no: orderingContext.order_no,
        table_code: tableCode,
        order_status: 'pending',
        payment_status: 'unpaid',
        payment_method: 'unpaid',
        estimated_wait_minutes: 18,
        subtotal_amount: summary.subtotal,
        service_fee_amount: summary.serviceFee,
        tax_amount: summary.tax,
        total_amount: summary.total,
        created_at: existingOrder?.created_at || orderingContext.created_at || now,
        persons: summary.persons.map(person => ({
          cart_id: person.cartId,
          person_slot: Number(person.personSlot || 0),
          guest_label: person.guestLabel,
          display_label: person.guestLabel,
          subtotal: person.subtotal,
          total: person.total
        }))
      }

      if (existingOrder) {
        Object.assign(existingOrder, nextPayload)
        existingOrder.timeline = Array.isArray(existingOrder.timeline) ? existingOrder.timeline : []
        existingOrder.timeline.push({
          status: 'pending',
          changed_at: now,
          source: 'customer',
          note: '顧客已送出訂單'
        })
      } else {
        state.orders.unshift({
          ...nextPayload,
          timeline: [
            { status: 'pending', changed_at: now, source: 'customer', note: '顧客已送出訂單' }
          ]
        })
      }

      state.activeOrderingByTable[tableCode] = {
        ...orderingContext,
        status: 'open'
      }

      return {
        orderId: orderingContext.order_id,
        orderNo: orderingContext.order_no
      }
    })
  },
  async 'checkout/success'({ orderId }) {
    await waitForMock()

    return readMockState(state => {
      const order = state.orders.find(entry => entry.id === orderId)
      if (!order) {
        throw new Error('ORDER_NOT_FOUND')
      }

        return cloneMockValue({
          orderId: order.id,
          orderNo: order.order_no,
          tableCode: order.table_code,
          status: order.order_status,
          paymentMethod: normalizePaymentMethod(order),
          estimatedWaitMinutes: order.estimated_wait_minutes,
          persons: collectOrderPersons(state, order)
        })
      })
    },
  async 'order-tracker/get'({ orderId }) {
    await waitForMock()

    return readMockState(state => {
      const order = state.orders.find(entry => entry.id === orderId)
      if (!order) {
        throw new Error('ORDER_NOT_FOUND')
      }

        return {
          order: {
            id: order.id,
            orderNo: order.order_no,
            tableCode: order.table_code,
            status: order.order_status,
            paymentStatus: order.payment_status,
            estimatedWaitMinutes: order.estimated_wait_minutes
          },
          persons: collectOrderPersons(state, order),
          timeline: cloneMockValue(order.timeline),
          history: cloneMockValue(
          state.orders
            .filter(entry => entry.table_code === order.table_code)
            .slice(0, 5)
            .map(entry => ({
              id: entry.id,
              orderNo: entry.order_no,
              createdAt: entry.created_at,
              totalAmount: entry.total_amount
            }))
        )
      }
    })
  },
  async 'counter/orders'({ filters = {} }) {
    await waitForMock()

    return readMockState(state => {
      const tableCode = String(filters.tableCode || '').trim()
      const orderNo = String(filters.orderNo || '').trim()
      const orderStatus = filters.orderStatus || 'all'
      const paymentStatus = filters.paymentStatus || 'all'

      return cloneMockValue(
        state.orders
          .filter(order => !tableCode || order.table_code.includes(tableCode))
          .filter(order => !orderNo || order.order_no.includes(orderNo))
          .filter(order => orderStatus === 'all' || order.order_status === orderStatus)
          .filter(order => paymentStatus === 'all' || order.payment_status === paymentStatus)
          .map(order => ({
            id: order.id,
            orderNo: order.order_no,
            tableCode: order.table_code,
            orderStatus: order.order_status,
            paymentStatus: order.payment_status,
            totalAmount: order.total_amount,
            guestCount: order.persons.length,
            createdAt: order.created_at
          }))
      )
    })
  },
  async 'counter/order-detail'({ orderId }) {
    await waitForMock()

    return readMockState(state => {
      const order = state.orders.find(entry => entry.id === orderId)
      if (!order) {
        throw new Error('ORDER_NOT_FOUND')
      }

      return {
        order: {
          id: order.id,
          orderNo: order.order_no,
          tableCode: order.table_code,
          orderStatus: order.order_status,
          paymentStatus: order.payment_status,
          subtotalAmount: order.subtotal_amount,
          serviceFeeAmount: order.service_fee_amount,
          taxAmount: order.tax_amount,
          totalAmount: order.total_amount,
          createdAt: order.created_at
        },
        persons: cloneMockValue(order.persons).map(person => ({
          guestLabel: person.guest_label,
          subtotal: person.subtotal,
          total: person.total
        })),
        items: collectOrderItems(state, order),
        timeline: cloneMockValue(order.timeline)
      }
    })
  },
  async 'counter/update-order-status'({ orderId, orderStatus, note = '' }) {
    await waitForMock()

    return writeMockState(state => {
      const order = updateOrderRecord(state, orderId, target => {
        target.order_status = orderStatus
        appendTimeline(
          target,
          orderStatus,
          'counter',
          note || `櫃台已將訂單狀態更新為 ${orderStatus}`
        )
      })

      return {
        id: order.id,
        orderStatus: order.order_status
      }
    })
  },
  async 'counter/update-payment-status'({ orderId, paymentStatus }) {
    await waitForMock()

    return writeMockState(state => {
      const order = updateOrderRecord(state, orderId, target => {
        target.payment_status = paymentStatus
        target.payment_method = paymentStatus === 'paid' ? 'cash' : 'unpaid'
        appendTimeline(target, target.order_status, 'counter', `櫃台已將付款狀態更新為 ${paymentStatus}`)
      })

      if (paymentStatus === 'paid') {
        delete state.activeOrderingByTable?.[order.table_code]
        const sessionBucket = getGuestOrderingSessionBucket(state, order.table_code)
        Object.values(sessionBucket).forEach(session => {
          if (session.order_id === order.id || session.order_no === order.order_no) {
            session.status = 'expired'
          }
        })
      }

      return {
        id: order.id,
        paymentStatus: order.payment_status
      }
    })
  },
  async 'kitchen/orders'() {
    await waitForMock()

    return readMockState(state =>
      cloneMockValue(
        state.orders
          .filter(order => order.order_status !== 'picked_up' && order.order_status !== 'cancelled')
          .map(order => {
            const bucket = state.cartsByTable[order.table_code]
            const items = order.persons.flatMap(person => {
              const cartItems = bucket?.itemsByCartId?.[person.cart_id] || []
              return cartItems.map(item => ({
                id: item.id,
                title: item.title,
                quantity: item.quantity,
                note: item.note,
                options: item.options || []
              }))
            })

            return {
              id: order.id,
              orderNo: order.order_no,
              tableCode: order.table_code,
              orderStatus: order.order_status,
              createdAt: order.created_at,
              waitMinutes: Math.max(
                0,
                Math.floor(
                  (Date.now() - new Date(String(order.created_at || '').replace(' ', 'T')).getTime()) / 60000
                ) || 0
              ),
              waitLabel: `${order.estimated_wait_minutes} min`,
              items
            }
          })
      )
    )
  },
  async 'kitchen/update-order-status'({ orderId, orderStatus }) {
    await waitForMock()

    return writeMockState(state => {
      const order = updateOrderRecord(state, orderId, target => {
        target.order_status = orderStatus
        appendTimeline(target, orderStatus, 'kitchen', `廚房已將訂單狀態更新為 ${orderStatus}`)
      })

      return {
        id: order.id,
        orderStatus: order.order_status
      }
    })
  },
  async 'dashboard/summary'() {
    await waitForMock()

    return readMockState(state => {
      const dailyOrderCount = state.orders.length
      const dailyRevenueTotal = state.orders.reduce(
        (sum, order) => sum + Number(order.total_amount || 0),
        0
      )
      const orderStatusBreakdown = {
        pending: 0,
        preparing: 0,
        ready: 0,
        picked_up: 0,
        cancelled: 0
      }
      const paymentStatusBreakdown = {
        unpaid: 0,
        paid: 0
      }
      const itemCounter = new Map()

      state.orders.forEach(order => {
        orderStatusBreakdown[order.order_status] = (orderStatusBreakdown[order.order_status] || 0) + 1
        paymentStatusBreakdown[order.payment_status] = (paymentStatusBreakdown[order.payment_status] || 0) + 1
        const bucket = state.cartsByTable[order.table_code]
        order.persons.forEach(person => {
          const items = bucket?.itemsByCartId?.[person.cart_id] || []
          items.forEach(item => {
            itemCounter.set(item.title, (itemCounter.get(item.title) || 0) + Number(item.quantity || 0))
          })
        })
      })

      return cloneMockValue({
        dailyOrderCount,
        dailyRevenueTotal,
        orderStatusBreakdown,
        paymentStatusBreakdown,
        topSellingItems: [...itemCounter.entries()]
          .sort((left, right) => right[1] - left[1])
          .slice(0, 5)
          .map(([name, quantity]) => ({ name, quantity }))
      })
    })
  },
  async 'reports/summary'({ filters = {} }) {
    await waitForMock()

    return readMockState(state => {
      const keyword = String(filters.keyword || '').trim().toLowerCase()
      const status = filters.status || 'all'
      const paymentStatus = filters.paymentStatus || 'all'
      const paymentMethod = filters.paymentMethod || 'all'

      const selectedOrders = state.orders
        .filter(order => status === 'all' || order.order_status === status)
        .filter(order => paymentStatus === 'all' || order.payment_status === paymentStatus)
        .filter(order => paymentMethod === 'all' || normalizePaymentMethod(order) === paymentMethod)
        .filter(order => {
          if (!keyword) return true
          return order.order_no.toLowerCase().includes(keyword) || order.table_code.toLowerCase().includes(keyword)
        })

      const grossSales = selectedOrders.reduce((sum, order) => sum + Number(order.total_amount || 0), 0)
      const paidAmount = selectedOrders
        .filter(order => order.payment_status === 'paid')
        .reduce((sum, order) => sum + Number(order.total_amount || 0), 0)
      const unpaidAmount = selectedOrders
        .filter(order => order.payment_status !== 'paid')
        .reduce((sum, order) => sum + Number(order.total_amount || 0), 0)
      const statusBreakdown = {
        pending: 0,
        preparing: 0,
        ready: 0,
        picked_up: 0,
        cancelled: 0
      }
      const paymentBreakdown = {
        cash: 0,
        counter_card: 0,
        other: 0,
        unpaid: 0
      }
      const itemCounter = new Map()

      selectedOrders.forEach(order => {
        statusBreakdown[order.order_status] = (statusBreakdown[order.order_status] || 0) + 1
        const currentPaymentMethod = normalizePaymentMethod(order)
        paymentBreakdown[currentPaymentMethod] = (paymentBreakdown[currentPaymentMethod] || 0) + 1

        collectOrderItems(state, order).forEach(item => {
          const current = itemCounter.get(item.title) || { quantity: 0, grossSales: 0 }
          itemCounter.set(item.title, {
            quantity: current.quantity + Number(item.quantity || 0),
            grossSales: current.grossSales + Number(item.price || 0) * Number(item.quantity || 0)
          })
        })
      })

      return cloneMockValue({
        summary: {
          businessDate: '2026-03-03',
          grossSales,
          paidAmount,
          unpaidAmount,
          orderCount: selectedOrders.length,
          completedOrderCount: selectedOrders.filter(order => order.order_status === 'picked_up').length,
          cancelledOrderCount: selectedOrders.filter(order => order.order_status === 'cancelled').length,
          averageOrderValue: selectedOrders.length ? Math.round(grossSales / selectedOrders.length) : 0
        },
        statusBreakdown,
        paymentBreakdown,
        topItems: [...itemCounter.entries()]
          .sort((left, right) => right[1].quantity - left[1].quantity)
          .slice(0, 5)
          .map(([itemName, stats], index) => ({
            itemId: `report-item-${index + 1}`,
            itemName,
            quantity: stats.quantity,
            grossSales: stats.grossSales
          }))
      })
    })
  },
  async 'reports/orders'({ filters = {} }) {
    await waitForMock()

    return readMockState(state => {
      const keyword = String(filters.keyword || '').trim().toLowerCase()
      const status = filters.status || 'all'
      const paymentStatus = filters.paymentStatus || 'all'
      const paymentMethod = filters.paymentMethod || 'all'

      return cloneMockValue({
        orders: state.orders
          .filter(order => status === 'all' || order.order_status === status)
          .filter(order => paymentStatus === 'all' || order.payment_status === paymentStatus)
          .filter(order => paymentMethod === 'all' || normalizePaymentMethod(order) === paymentMethod)
          .filter(order => {
            if (!keyword) return true
            return order.order_no.toLowerCase().includes(keyword) || order.table_code.toLowerCase().includes(keyword)
          })
          .map(order => ({
            orderId: order.id,
            orderNo: order.order_no,
            tableCode: order.table_code,
            createdAt: order.created_at,
            status: order.order_status,
            paymentStatus: order.payment_status,
            paymentMethod: normalizePaymentMethod(order),
            totalAmount: order.total_amount,
            itemCount: collectOrderItems(state, order).reduce((sum, item) => sum + Number(item.quantity || 0), 0),
            staffNoteSummary: order.timeline.at(-1)?.note || ''
          }))
      })
    })
  },
  async 'audit-close/summary'({ businessDate = '2026-03-03' } = {}) {
    await waitForMock()

    return readMockState(state =>
      cloneMockValue(buildAuditSummary(state, businessDate))
    )
  },
  async 'audit-close/history'({ businessDate = '' } = {}) {
    await waitForMock()

    return readMockState(state =>
      cloneMockValue({
        history: state.auditHistory
          .filter(entry => !businessDate || entry.business_date === businessDate)
          .map(entry => ({
            id: entry.id,
            businessDate: entry.business_date,
            action: entry.action,
            actorName: entry.actor_name,
            actorRole: entry.actor_role,
            createdAt: entry.created_at,
            reason: entry.reason,
            reasonType: entry.reason_type,
            affectedScopes: entry.affected_scopes || [],
            beforeStatus: entry.before_status || '',
            afterStatus: entry.after_status || ''
          }))
      })
    )
  },
  async 'audit-close/close'({ businessDate = '2026-03-03', reason = '', reasonType = 'daily_close' } = {}) {
    await waitForMock()

    return writeMockState(state => {
      const session = ensureManagerSession(state)
      const summary = buildAuditSummary(state, businessDate)

      if (summary.lockState.isLocked) {
        throw new Error('BUSINESS_DATE_ALREADY_CLOSED')
      }

      if (summary.blockingIssues.length > 0) {
        throw new Error('AUDIT_CLOSE_BLOCKED')
      }

      state.auditClosings[businessDate] = {
        business_date: businessDate,
        status: 'closed',
        closed_at: '2026-03-03 23:10:00',
        closed_by_name: session.name,
        closed_by_role: session.role,
        locked_scopes: ['orders', 'payments'],
        close_reason: String(reason || '').trim()
      }

      appendAuditHistory(state, {
        businessDate,
        action: 'close',
        actorName: session.name,
        actorRole: session.role,
        createdAt: '2026-03-03 23:10:00',
        reason,
        reasonType,
        affectedScopes: ['orders', 'payments'],
        beforeStatus: 'open',
        afterStatus: 'closed'
      })

      return cloneMockValue(buildAuditSummary(state, businessDate))
    })
  },
  async 'audit-close/unlock'({ businessDate = '2026-03-03', reason = '', reasonType = 'correction' } = {}) {
    await waitForMock()

    return writeMockState(state => {
      const session = ensureManagerSession(state)
      const safeReason = String(reason || '').trim()
      const current = findClosingRecord(state, businessDate)

      if (!current || current.status !== 'closed') {
        throw new Error('BUSINESS_DATE_NOT_CLOSED')
      }

      if (!safeReason) {
        throw new Error('UNLOCK_REASON_REQUIRED')
      }

      state.auditClosings[businessDate] = {
        ...current,
        status: 'reopened',
        unlocked_at: '2026-03-03 23:20:00',
        unlocked_by_name: session.name,
        unlocked_by_role: session.role,
        unlock_reason: safeReason,
        locked_scopes: []
      }

      appendAuditHistory(state, {
        businessDate,
        action: 'unlock',
        actorName: session.name,
        actorRole: session.role,
        createdAt: '2026-03-03 23:20:00',
        reason: safeReason,
        reasonType,
        affectedScopes: ['orders', 'payments'],
        beforeStatus: 'closed',
        afterStatus: 'reopened'
      })

      return cloneMockValue(buildAuditSummary(state, businessDate))
    })
  },
  async 'menu-admin/items'() {
    await waitForMock()

    return readMockState(state =>
      cloneMockValue({
        categories: buildMenuAdminCategories(state),
        items: buildDashboardMenuItems(state)
      })
    )
  },
  async 'menu-admin/create-category'({ name }) {
    await waitForMock()

    return writeMockState(state => {
      const safeName = String(name || '').trim()
      if (!safeName) {
        throw new Error('MENU_CATEGORY_NAME_REQUIRED')
      }

      const exists = state.categories.some(
        category => String(category.name || '').trim().toLowerCase() === safeName.toLowerCase()
      )
      if (exists) {
        throw new Error('MENU_CATEGORY_ALREADY_EXISTS')
      }

      const sortOrder =
        Math.max(0, ...state.categories.map(category => Number(category.sort_order || 0))) + 10

      state.categories.push({
        id: createCategoryId(state),
        name: safeName,
        sort_order: sortOrder
      })

      return cloneMockValue({
        categories: buildMenuAdminCategories(state),
        items: buildDashboardMenuItems(state)
      })
    })
  },
  async 'menu-admin/update-category'({ categoryId, name }) {
    await waitForMock()

    return writeMockState(state => {
      const target = state.categories.find(category => category.id === categoryId)
      if (!target) {
        throw new Error('MENU_CATEGORY_NOT_FOUND')
      }

      const safeName = String(name || '').trim()
      if (!safeName) {
        throw new Error('MENU_CATEGORY_NAME_REQUIRED')
      }

      const exists = state.categories.some(
        category =>
          category.id !== categoryId &&
          String(category.name || '').trim().toLowerCase() === safeName.toLowerCase()
      )
      if (exists) {
        throw new Error('MENU_CATEGORY_ALREADY_EXISTS')
      }

      target.name = safeName

      return cloneMockValue({
        categories: buildMenuAdminCategories(state),
        items: buildDashboardMenuItems(state)
      })
    })
  },
  async 'menu-admin/delete-category'({ categoryId }) {
    await waitForMock()

    return writeMockState(state => {
      const target = state.categories.find(category => category.id === categoryId)
      if (!target) {
        throw new Error('MENU_CATEGORY_NOT_FOUND')
      }

      const inUse = state.items.some(item => item.category_id === categoryId)
      if (inUse) {
        throw new Error('MENU_CATEGORY_IN_USE')
      }

      state.categories = state.categories.filter(category => category.id !== categoryId)
      state.categories
        .sort((left, right) => Number(left.sort_order || 0) - Number(right.sort_order || 0))
        .forEach((category, index) => {
          category.sort_order = (index + 1) * 10
        })

      return cloneMockValue({
        categories: buildMenuAdminCategories(state),
        items: buildDashboardMenuItems(state)
      })
    })
  },
  async 'menu-admin/reorder-categories'({ categoryIds = [], categoryId, direction }) {
    await waitForMock()

    return writeMockState(state => {
      let categories = [...state.categories].sort(
        (left, right) => Number(left.sort_order || 0) - Number(right.sort_order || 0)
      )

      if (Array.isArray(categoryIds) && categoryIds.length > 0) {
        const orderMap = new Map(
          categoryIds.map((id, index) => [String(id || '').trim(), index])
        )
        const ids = categories.map(category => String(category.id || ''))

        if (
          orderMap.size !== categories.length ||
          ids.some(id => !orderMap.has(id))
        ) {
          throw new Error('MENU_CATEGORY_REORDER_INVALID')
        }

        categories = [...categories].sort(
          (left, right) => orderMap.get(String(left.id || '')) - orderMap.get(String(right.id || ''))
        )
      } else {
        const currentIndex = categories.findIndex(category => category.id === categoryId)

        if (currentIndex < 0) {
          throw new Error('MENU_CATEGORY_NOT_FOUND')
        }

        const targetIndex =
          direction === 'up' ? currentIndex - 1 : direction === 'down' ? currentIndex + 1 : currentIndex

        if (targetIndex < 0 || targetIndex >= categories.length || targetIndex === currentIndex) {
          return cloneMockValue({
            categories: buildMenuAdminCategories(state),
            items: buildDashboardMenuItems(state)
          })
        }

        const [movedCategory] = categories.splice(currentIndex, 1)
        categories.splice(targetIndex, 0, movedCategory)
      }
      categories.forEach((category, index) => {
        category.sort_order = (index + 1) * 10
      })
      state.categories = categories

      return cloneMockValue({
        categories: buildMenuAdminCategories(state),
        items: buildDashboardMenuItems(state)
      })
    })
  },
  async 'menu-admin/create-item'({ title, categoryId, price, description = '', imageUrl = '' }) {
    await waitForMock()

    return writeMockState(state => {
      const safeTitle = String(title || '').trim()
      const safeCategoryId = String(categoryId || '').trim()
      const nextPrice = Number(price)

      if (!safeTitle) {
        throw new Error('MENU_ITEM_TITLE_REQUIRED')
      }

      if (!state.categories.find(category => category.id === safeCategoryId)) {
        throw new Error('MENU_CATEGORY_NOT_FOUND')
      }

      if (!Number.isFinite(nextPrice) || nextPrice < 0) {
        throw new Error('INVALID_MENU_ITEM_PRICE')
      }

      state.items.unshift({
        id: createMenuItemId(state),
        category_id: safeCategoryId,
        name: safeTitle,
        description: String(description || '').trim(),
        base_price: Math.round(nextPrice),
        image_url: String(imageUrl || '').trim(),
        sold_out: false,
        hidden: false,
        badge: '',
        tone: 'mint',
        tags: [],
        default_note: '',
        default_option_ids: [],
        option_groups: []
      })

      return cloneMockValue({
        categories: buildMenuAdminCategories(state),
        items: buildDashboardMenuItems(state)
      })
    })
  },
  async 'menu-admin/update-item-status'({ itemId, soldOut, hidden }) {
    await waitForMock()

    return writeMockState(state => {
      const target = state.items.find(item => item.id === itemId)
      if (!target) {
        throw new Error('MENU_ITEM_NOT_FOUND')
      }

      if (typeof soldOut === 'boolean') {
        target.sold_out = soldOut
      }

      if (typeof hidden === 'boolean') {
        target.hidden = hidden
      }

      return cloneMockValue({
        item: buildDashboardMenuItems(state).find(item => item.id === itemId)
      })
    })
  },
  async 'menu-admin/update-item-price'({ itemId, price }) {
    await waitForMock()

    return writeMockState(state => {
      const target = state.items.find(item => item.id === itemId)
      if (!target) {
        throw new Error('MENU_ITEM_NOT_FOUND')
      }

      const nextPrice = Number(price)
      if (!Number.isFinite(nextPrice) || nextPrice < 0) {
        throw new Error('INVALID_MENU_ITEM_PRICE')
      }

      target.base_price = Math.round(nextPrice)

      return cloneMockValue({
        item: buildDashboardMenuItems(state).find(item => item.id === itemId)
      })
    })
  },
  async 'menu-admin/update-item-content'({ itemId, title, description = '' }) {
    await waitForMock()

    return writeMockState(state => {
      const target = state.items.find(item => item.id === itemId)
      if (!target) {
        throw new Error('MENU_ITEM_NOT_FOUND')
      }

      const safeTitle = String(title || '').trim()
      if (!safeTitle) {
        throw new Error('MENU_ITEM_TITLE_REQUIRED')
      }

      target.name = safeTitle
      target.description = String(description || '').trim()

      return cloneMockValue({
        item: buildDashboardMenuItems(state).find(item => item.id === itemId)
      })
    })
  },
  async 'menu-admin/update-item-image'({ itemId, imageUrl }) {
    await waitForMock()

    return writeMockState(state => {
      const target = state.items.find(item => item.id === itemId)
      if (!target) {
        throw new Error('MENU_ITEM_NOT_FOUND')
      }

      target.image_url = String(imageUrl || '').trim()

      return cloneMockValue({
        item: buildDashboardMenuItems(state).find(item => item.id === itemId)
      })
    })
  },
  async 'menu-admin/update-item-category'({ itemId, categoryId }) {
    await waitForMock()

    return writeMockState(state => {
      const target = state.items.find(item => item.id === itemId)
      if (!target) {
        throw new Error('MENU_ITEM_NOT_FOUND')
      }

      const safeCategoryId = String(categoryId || '').trim()
      if (!state.categories.find(category => category.id === safeCategoryId)) {
        throw new Error('MENU_CATEGORY_NOT_FOUND')
      }

      target.category_id = safeCategoryId

      return cloneMockValue({
        item: buildDashboardMenuItems(state).find(item => item.id === itemId)
      })
    })
  },
  async 'menu-admin/add-option-group'({ itemId, label, type = 'single', required = false }) {
    await waitForMock()

    return writeMockState(state => {
      const target = state.items.find(item => item.id === itemId)
      if (!target) {
        throw new Error('MENU_ITEM_NOT_FOUND')
      }

      const safeLabel = String(label || '').trim()
      if (!safeLabel) {
        throw new Error('OPTION_GROUP_LABEL_REQUIRED')
      }

      if (!['single', 'multi'].includes(type)) {
        throw new Error('INVALID_OPTION_GROUP_TYPE')
      }

      if (!Array.isArray(target.option_groups)) {
        target.option_groups = []
      }

      target.option_groups.push({
        id: createOptionGroupId(state),
        label: safeLabel,
        type,
        required: Boolean(required),
        options: []
      })

      return cloneMockValue({
        item: buildDashboardMenuItems(state).find(item => item.id === itemId)
      })
    })
  },
  async 'menu-admin/add-option'({ itemId, groupId, label, priceDelta = 0 }) {
    await waitForMock()

    return writeMockState(state => {
      const target = state.items.find(item => item.id === itemId)
      if (!target) {
        throw new Error('MENU_ITEM_NOT_FOUND')
      }

      const optionGroup = (target.option_groups || []).find(group => group.id === groupId)
      if (!optionGroup) {
        throw new Error('OPTION_GROUP_NOT_FOUND')
      }

      const safeLabel = String(label || '').trim()
      const safePriceDelta = Number(priceDelta)
      if (!safeLabel) {
        throw new Error('OPTION_LABEL_REQUIRED')
      }

      if (!Number.isFinite(safePriceDelta)) {
        throw new Error('INVALID_OPTION_PRICE_DELTA')
      }

      optionGroup.options.push({
        id: createOptionId(state),
        label: safeLabel,
        price_delta: Math.round(safePriceDelta)
      })

      return cloneMockValue({
        item: buildDashboardMenuItems(state).find(item => item.id === itemId)
      })
    })
  },
  async 'menu-admin/update-option-group'({
    itemId,
    groupId,
    label,
    type = 'single',
    required = false
  }) {
    await waitForMock()

    return writeMockState(state => {
      const target = state.items.find(item => item.id === itemId)
      if (!target) {
        throw new Error('MENU_ITEM_NOT_FOUND')
      }

      const optionGroup = (target.option_groups || []).find(group => group.id === groupId)
      if (!optionGroup) {
        throw new Error('OPTION_GROUP_NOT_FOUND')
      }

      const safeLabel = String(label || '').trim()
      if (!safeLabel) {
        throw new Error('OPTION_GROUP_LABEL_REQUIRED')
      }

      if (!['single', 'multi'].includes(type)) {
        throw new Error('INVALID_OPTION_GROUP_TYPE')
      }

      optionGroup.label = safeLabel
      optionGroup.type = type
      optionGroup.required = Boolean(required)
      target.default_option_ids = normalizeAdminDefaultOptionIds(
        target.option_groups || [],
        target.default_option_ids || []
      )

      return cloneMockValue({
        item: buildDashboardMenuItems(state).find(item => item.id === itemId)
      })
    })
  },
  async 'menu-admin/delete-option-group'({ itemId, groupId }) {
    await waitForMock()

    return writeMockState(state => {
      const target = state.items.find(item => item.id === itemId)
      if (!target) {
        throw new Error('MENU_ITEM_NOT_FOUND')
      }

      const optionGroups = target.option_groups || []
      const optionGroup = optionGroups.find(group => group.id === groupId)
      if (!optionGroup) {
        throw new Error('OPTION_GROUP_NOT_FOUND')
      }

      const optionIds = new Set((optionGroup.options || []).map(option => option.id))
      target.option_groups = optionGroups.filter(group => group.id !== groupId)
      target.default_option_ids = (target.default_option_ids || []).filter(
        optionId => !optionIds.has(optionId)
      )

      return cloneMockValue({
        item: buildDashboardMenuItems(state).find(item => item.id === itemId)
      })
    })
  },
  async 'menu-admin/update-option'({ itemId, groupId, optionId, label, priceDelta = 0 }) {
    await waitForMock()

    return writeMockState(state => {
      const target = state.items.find(item => item.id === itemId)
      if (!target) {
        throw new Error('MENU_ITEM_NOT_FOUND')
      }

      const optionGroup = (target.option_groups || []).find(group => group.id === groupId)
      if (!optionGroup) {
        throw new Error('OPTION_GROUP_NOT_FOUND')
      }

      const option = (optionGroup.options || []).find(entry => entry.id === optionId)
      if (!option) {
        throw new Error('OPTION_NOT_FOUND')
      }

      const safeLabel = String(label || '').trim()
      const safePriceDelta = Number(priceDelta)
      if (!safeLabel) {
        throw new Error('OPTION_LABEL_REQUIRED')
      }

      if (!Number.isFinite(safePriceDelta)) {
        throw new Error('INVALID_OPTION_PRICE_DELTA')
      }

      option.label = safeLabel
      option.price_delta = Math.round(safePriceDelta)

      return cloneMockValue({
        item: buildDashboardMenuItems(state).find(item => item.id === itemId)
      })
    })
  },
  async 'menu-admin/delete-option'({ itemId, groupId, optionId }) {
    await waitForMock()

    return writeMockState(state => {
      const target = state.items.find(item => item.id === itemId)
      if (!target) {
        throw new Error('MENU_ITEM_NOT_FOUND')
      }

      const optionGroup = (target.option_groups || []).find(group => group.id === groupId)
      if (!optionGroup) {
        throw new Error('OPTION_GROUP_NOT_FOUND')
      }

      optionGroup.options = (optionGroup.options || []).filter(option => option.id !== optionId)
      target.default_option_ids = (target.default_option_ids || []).filter(
        selectedOptionId => selectedOptionId !== optionId
      )

      return cloneMockValue({
        item: buildDashboardMenuItems(state).find(item => item.id === itemId)
      })
    })
  },
  async 'menu-admin/update-default-options'({ itemId, selectedOptionIds = [] }) {
    await waitForMock()

    return writeMockState(state => {
      const target = state.items.find(item => item.id === itemId)
      if (!target) {
        throw new Error('MENU_ITEM_NOT_FOUND')
      }

      target.default_option_ids = normalizeAdminDefaultOptionIds(
        target.option_groups || [],
        selectedOptionIds
      )

      return cloneMockValue({
        item: buildDashboardMenuItems(state).find(item => item.id === itemId)
      })
    })
  },
  async 'table-admin/tables'() {
    await waitForMock()

    return readMockState(state =>
      cloneMockValue({
        tables: buildTableAdminTables(state)
      })
    )
  },
  async 'table-admin/create-table'({ code, name, areaName, dineMode = 'dine_in' }) {
    await waitForMock()

    return writeMockState(state => {
      const safeCode = String(code || '').trim().toUpperCase()
      const safeName = String(name || '').trim()
      const safeAreaName = String(areaName || '').trim() || '???'

      if (!safeCode) {
        throw new Error('TABLE_CODE_REQUIRED')
      }

      if (state.tables[safeCode]) {
        throw new Error('TABLE_CODE_ALREADY_EXISTS')
      }

      state.tables[safeCode] = {
        id: createTableId(state),
        code: safeCode,
        name: safeName || `${safeCode} ?`,
        area_name: safeAreaName,
        dine_mode: dineMode,
        status: 'active',
        is_ordering_enabled: true,
        sort_order: Object.keys(state.tables).length + 1
      }

      return cloneMockValue({
        tables: buildTableAdminTables(state)
      })
    })
  },
  async 'table-admin/update-table'({ code, name, areaName, dineMode, status, orderingEnabled }) {
    await waitForMock()

    return writeMockState(state => {
      const safeCode = String(code || '').trim().toUpperCase()
      const target = state.tables[safeCode]
      if (!target) {
        throw new Error('TABLE_NOT_FOUND')
      }

      if (typeof name === 'string') {
        target.name = name.trim() || `${safeCode} ?`
      }

      if (typeof areaName === 'string') {
        target.area_name = areaName.trim() || '???'
      }

      if (typeof dineMode === 'string' && dineMode.trim()) {
        target.dine_mode = dineMode
      }

      if (typeof status === 'string' && status.trim()) {
        target.status = status
      }

      if (typeof orderingEnabled === 'boolean') {
        target.is_ordering_enabled = orderingEnabled
      }

      return cloneMockValue({
        table: buildTableAdminTables(state).find(table => table.code === safeCode)
      })
    })
  },
  async 'table-admin/delete-table'({ code }) {
    await waitForMock()

    return writeMockState(state => {
      const safeCode = String(code || '').trim().toUpperCase()
      if (!state.tables[safeCode]) {
        throw new Error('TABLE_NOT_FOUND')
      }

      delete state.tables[safeCode]

      Object.values(state.tables)
        .sort((left, right) => Number(left.sort_order || 0) - Number(right.sort_order || 0))
        .forEach((table, index) => {
          table.sort_order = index + 1
        })

      return cloneMockValue({
        tables: buildTableAdminTables(state)
      })
    })
  },
  async 'table-admin/reorder-tables'({ code, direction }) {
    await waitForMock()

    return writeMockState(state => {
      const safeCode = String(code || '').trim().toUpperCase()
      const tables = Object.values(state.tables).sort(
        (left, right) => Number(left.sort_order || 0) - Number(right.sort_order || 0)
      )
      const currentIndex = tables.findIndex(table => table.code === safeCode)

      if (currentIndex < 0) {
        throw new Error('TABLE_NOT_FOUND')
      }

      const targetIndex =
        direction === 'up' ? currentIndex - 1 : direction === 'down' ? currentIndex + 1 : currentIndex

      if (targetIndex < 0 || targetIndex >= tables.length || targetIndex === currentIndex) {
        return cloneMockValue({
          tables: buildTableAdminTables(state)
        })
      }

      const [movedTable] = tables.splice(currentIndex, 1)
      tables.splice(targetIndex, 0, movedTable)

      tables.forEach((table, index) => {
        table.sort_order = index + 1
      })

      return cloneMockValue({
        tables: buildTableAdminTables(state)
      })
    })
  }
}
export async function mockApiRequest(endpoint, payload = {}) {
  const handler = handlers[endpoint]
  if (!handler) {
    throw new Error(`MOCK_ENDPOINT_NOT_FOUND: ${endpoint}`)
  }

  const enrichedPayload = { ...payload }
  const tableCode = String(enrichedPayload.tableCode || '').trim()
  const storedToken =
    enrichedPayload.orderingSessionToken ||
    (tableCode ? getGuestOrderingSessionToken(tableCode) : '')

  if (storedToken) {
    enrichedPayload.orderingSessionToken = storedToken
  }

  const result = await handler(enrichedPayload)
  const resultToken =
    result?.orderingSessionToken ||
    result?.ordering_session_token ||
    enrichedPayload.orderingSessionToken

  if (tableCode && resultToken) {
    setGuestOrderingSessionToken(tableCode, resultToken)
  }

  return result
}
