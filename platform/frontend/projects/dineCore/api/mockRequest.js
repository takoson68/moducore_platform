import {
  cloneMockValue,
  ensureMockTable,
  readMockState,
  waitForMock,
  writeMockState
} from './mockRuntime.js'

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

function createMenuItemId(state) {
  const nextId = String(state.nextIds.menuItem || 1).padStart(3, '0')
  state.nextIds.menuItem = Number(nextId) + 1
  return `custom-item-${nextId}`
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

function buildCartPayload(state, tableCode) {
  const bucket = getCartBucket(state, tableCode)
  const itemSchemasByMenuItemId = buildItemSchemasByMenuItemId(state)
  const cartItemsByCartId = Object.fromEntries(
    Object.entries(bucket.itemsByCartId).map(([cartId, items]) => [
      cartId,
      items.map(item => {
        const menuItem = state.items.find(entry => entry.id === item.menu_item_id)
        return {
          ...cloneMockValue(item),
          editSchema: menuItem ? buildCartItemEditSchema(menuItem, item) : null
        }
      })
    ])
  )

  return {
    carts: bucket.carts.map(cart => summarizeCart(cart, bucket.itemsByCartId[cart.id] || [])),
    cartItemsByCartId,
    itemSchemasByMenuItemId
  }
}

function buildCheckoutSummary(state, tableCode) {
  const bucket = getCartBucket(state, tableCode)
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
    const personServiceFee = Math.round(summary.subtotal * 0.05)
    const personTax = Math.round(summary.subtotal * 0.025)

    return {
      cartId: summary.id,
      guestLabel: summary.guestLabel,
      subtotal: summary.subtotal,
      total: summary.subtotal + personServiceFee + personTax,
      items: personItems
    }
  })

  const subtotal = persons.reduce((sum, person) => sum + person.subtotal, 0)
  const serviceFee = Math.round(subtotal * 0.05)
  const tax = Math.round(subtotal * 0.025)

  return {
    subtotal,
    serviceFee,
    tax,
    total: subtotal + serviceFee + tax,
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

const handlers = {
  async 'entry/context'({ tableCode }) {
    await waitForMock()
    return readMockState(state => {
      const table = ensureMockTable(state, tableCode)
      const latestOrder = state.orders.find(order => order.table_code === tableCode)

      return cloneMockValue({
        ...table,
        latest_order_id: latestOrder?.id || '',
        latest_order_no: latestOrder?.order_no || '',
        latest_order_status: latestOrder?.order_status || ''
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
        role: staffUser.role
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
  async 'menu/list'({ tableCode }) {
    await waitForMock()

    return readMockState(state => {
      ensureMockTable(state, tableCode)

      return {
        categories: cloneMockValue(state.categories),
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
  async 'cart/get'({ tableCode }) {
    await waitForMock()

    return readMockState(state => buildCartPayload(state, tableCode))
  },
  async 'cart/add-item'({ tableCode, cartId, menuItemId, customization }) {
    await waitForMock()

    return writeMockState(state => {
      const bucket = getCartBucket(state, tableCode)
      const menuItem = findMenuItem(state, menuItemId)
      const resolved = resolveCustomization(menuItem, customization)
      const nextId = `cart-item-${state.nextIds.cartItem}`

      state.nextIds.cartItem += 1

      if (!bucket.itemsByCartId[cartId]) {
        bucket.itemsByCartId[cartId] = []
      }

      bucket.itemsByCartId[cartId].push({
        id: nextId,
        menu_item_id: menuItem.id,
        title: menuItem.name,
        quantity: 1,
        price: resolved.price,
        note: resolved.note,
        options: resolved.options,
        selected_option_ids: resolved.selectedOptionIds
      })

      return buildCartPayload(state, tableCode)
    })
  },
  async 'cart/change-item-quantity'({ tableCode, cartId, cartItemId, delta }) {
    await waitForMock()

    return writeMockState(state => {
      const bucket = getCartBucket(state, tableCode)
      const items = bucket.itemsByCartId[cartId] || []
      const target = items.find(item => item.id === cartItemId)

      if (target) {
        target.quantity += delta
        if (target.quantity <= 0) {
          bucket.itemsByCartId[cartId] = items.filter(item => item.id !== cartItemId)
        }
      }

      return buildCartPayload(state, tableCode)
    })
  },
  async 'cart/update-item'({ tableCode, cartId, cartItemId, customization }) {
    await waitForMock()

    return writeMockState(state => {
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

      return buildCartPayload(state, tableCode)
    })
  },
  async 'checkout/summary'({ tableCode }) {
    await waitForMock()
    return readMockState(state => buildCheckoutSummary(state, tableCode))
  },
  async 'checkout/submit'({ tableCode }) {
    await waitForMock(180)

    return writeMockState(state => {
      ensureMockTable(state, tableCode)
      const summary = buildCheckoutSummary(state, tableCode)
      const { id, orderNo } = createOrderIdentifiers(state)
      const now = '2026-03-03 22:30:00'

      state.orders.unshift({
        id,
        order_no: orderNo,
        table_code: tableCode,
        order_status: 'pending',
        payment_status: 'unpaid',
        estimated_wait_minutes: 18,
        subtotal_amount: summary.subtotal,
        service_fee_amount: summary.serviceFee,
        tax_amount: summary.tax,
        total_amount: summary.total,
        created_at: now,
        persons: summary.persons.map(person => ({
          cart_id: person.cartId,
          guest_label: person.guestLabel,
          subtotal: person.subtotal,
          total: person.total
        })),
        timeline: [
          { status: 'pending', changed_at: now, source: 'customer', note: '顧客已送出訂單' }
        ]
      })

      return {
        orderId: id,
        orderNo
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
          paymentMethod: '櫃台付款',
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
        appendTimeline(target, target.order_status, 'counter', `櫃台已將付款狀態更新為 ${paymentStatus}`)
      })

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
  async 'menu-admin/items'() {
    await waitForMock()

    return readMockState(state =>
      cloneMockValue({
        categories: state.categories.map(category => ({
          id: category.id,
          name: category.name
        })),
        items: buildDashboardMenuItems(state)
      })
    )
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
        categories: state.categories.map(category => ({
          id: category.id,
          name: category.name
        })),
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

  return handler(payload)
}
