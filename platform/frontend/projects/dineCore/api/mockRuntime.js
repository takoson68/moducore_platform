const STORAGE_KEY = 'dinecore-mock-state-v6'

function cloneValue(value) {
  return JSON.parse(JSON.stringify(value))
}

function wait(ms = 120) {
  return new Promise(resolve => window.setTimeout(resolve, ms))
}

function createOption(id, label, priceDelta = 0) {
  return {
    id,
    label,
    price_delta: priceDelta
  }
}

function createGroup(id, label, type, options, required = false) {
  return {
    id,
    label,
    type,
    required,
    options
  }
}

function createDefaultState() {
  return {
    tables: {
      A01: {
        id: 'tbl_a01',
        code: 'A01',
        name: 'A01 桌',
        area_name: '內用區',
        dine_mode: 'dine_in',
        status: 'active',
        is_ordering_enabled: true,
        sort_order: 1
      }
    },
    categories: [
      { id: 'popular', name: '人氣推薦', sort_order: 10 },
      { id: 'main', name: '主餐', sort_order: 20 },
      { id: 'drink', name: '飲品', sort_order: 30 },
      { id: 'seasonal', name: '季節限定', sort_order: 40 },
      { id: 'new', name: '新品上市', sort_order: 50 }
    ],
    items: [
      {
        id: 'seaweed-noodle-signature',
        category_id: 'seasonal',
        name: '經典海藻涼麵',
        description: '海藻麵搭配招牌醬汁與清爽配菜，適合夏季主打。',
        base_price: 154,
        image_url: 'https://picsum.photos/seed/dinecore-seaweed-signature/960/960',
        sold_out: false,
        hidden: false,
        badge: '人氣推薦',
        tone: 'green',
        tags: ['招牌', '季節限定'],
        default_note: '不要香菜',
        default_option_ids: ['size-regular', 'spice-normal'],
        option_groups: [
          createGroup(
            'size',
            '份量',
            'single',
            [createOption('size-regular', '標準'), createOption('size-large', '加大', 20)],
            true
          ),
          createGroup(
            'spice',
            '辣度',
            'single',
            [
              createOption('spice-mild', '小辣'),
              createOption('spice-normal', '正常'),
              createOption('spice-hot', '大辣', 10)
            ],
            true
          ),
          createGroup(
            'garnish',
            '加料',
            'multi',
            [createOption('garnish-scallion', '加蔥', 5), createOption('garnish-egg', '加蛋', 18)],
            false
          )
        ]
      },
      {
        id: 'seaweed-noodle-single',
        category_id: 'popular',
        name: '單點海藻涼麵',
        description: '單點版本，適合小份量或搭配飲品。',
        base_price: 99,
        image_url: 'https://picsum.photos/seed/dinecore-seaweed-single/960/960',
        sold_out: false,
        hidden: false,
        badge: '',
        tone: 'mint',
        tags: ['單點'],
        default_note: '',
        default_option_ids: ['single-size-regular'],
        option_groups: [
          createGroup(
            'single-size',
            '份量',
            'single',
            [createOption('single-size-regular', '標準'), createOption('single-size-large', '加大', 15)],
            true
          )
        ]
      },
      {
        id: 'chicken-noodle',
        category_id: 'main',
        name: '嫩雞胸拌麵',
        description: '雞胸肉與特製醬汁搭配，份量飽足。',
        base_price: 203,
        image_url: 'https://picsum.photos/seed/dinecore-chicken-noodle/960/960',
        sold_out: false,
        hidden: false,
        badge: '',
        tone: 'sand',
        tags: ['主餐'],
        default_note: '麵加大',
        default_option_ids: ['chicken-size-large'],
        option_groups: [
          createGroup(
            'chicken-size',
            '份量',
            'single',
            [createOption('chicken-size-regular', '標準'), createOption('chicken-size-large', '加大', 20)],
            true
          ),
          createGroup(
            'chicken-extra',
            '加料',
            'multi',
            [
              createOption('chicken-extra-egg', '加蛋', 18),
              createOption('chicken-extra-veggie', '加青菜', 12)
            ],
            false
          )
        ]
      },
      {
        id: 'winter-plum-tea',
        category_id: 'drink',
        name: '冬梅冰茶',
        description: '酸甜清爽，適合搭配涼麵。',
        base_price: 45,
        image_url: 'https://picsum.photos/seed/dinecore-winter-plum-tea/960/960',
        sold_out: false,
        hidden: false,
        badge: '',
        tone: 'amber',
        tags: ['飲品'],
        default_note: '少冰',
        default_option_ids: ['tea-sugar-half', 'tea-ice-less'],
        option_groups: [
          createGroup(
            'tea-sugar',
            '甜度',
            'single',
            [
              createOption('tea-sugar-none', '無糖'),
              createOption('tea-sugar-half', '半糖'),
              createOption('tea-sugar-normal', '正常')
            ],
            true
          ),
          createGroup(
            'tea-ice',
            '冰量',
            'single',
            [
              createOption('tea-ice-none', '去冰'),
              createOption('tea-ice-less', '少冰'),
              createOption('tea-ice-normal', '正常')
            ],
            true
          )
        ]
      }
    ],
    cartsByTable: {
      A01: {
        carts: [
          { id: 'guest-a', guest_label: '1號顧客', note: '先點主餐' },
          { id: 'guest-b', guest_label: '2號顧客', note: '只喝飲料' }
        ],
        itemsByCartId: {
          'guest-a': [
            {
              id: 'guest-a-item-1',
              menu_item_id: 'seaweed-noodle-signature',
              title: '經典海藻涼麵',
              quantity: 1,
              price: 154,
              note: '不要香菜',
              options: ['標準', '正常'],
              selected_option_ids: ['size-regular', 'spice-normal']
            }
          ],
          'guest-b': [
            {
              id: 'guest-b-item-1',
              menu_item_id: 'winter-plum-tea',
              title: '冬梅冰茶',
              quantity: 1,
              price: 45,
              note: '少冰',
              options: ['半糖', '少冰'],
              selected_option_ids: ['tea-sugar-half', 'tea-ice-less']
            }
          ]
        }
      }
    },
    guestOrderingSessionsByTable: {
      A01: {}
    },
    activeOrderingByTable: {
      A01: {
        order_id: 'demo-order',
        order_no: 'DC202603030001',
        status: 'open',
        created_at: '2026-03-03 22:16:00'
      }
    },
    orders: [
      {
        id: 'demo-order',
        order_no: 'DC202603030001',
        table_code: 'A01',
        order_status: 'preparing',
        payment_status: 'unpaid',
        payment_method: 'unpaid',
        estimated_wait_minutes: 15,
        subtotal_amount: 199,
        service_fee_amount: 10,
        tax_amount: 5,
        total_amount: 214,
        created_at: '2026-03-03 22:16:00',
        persons: [
          {
            cart_id: 'guest-a',
            person_slot: 1,
            display_label: '1號顧客',
            guest_label: '1號顧客',
            subtotal: 154,
            total: 166
          },
          {
            cart_id: 'guest-b',
            person_slot: 2,
            display_label: '2號顧客',
            guest_label: '2號顧客',
            subtotal: 45,
            total: 48
          }
        ],
        timeline: [
          {
            status: 'pending',
            changed_at: '2026-03-03 22:16:00',
            source: 'customer',
            note: '顧客已送出訂單'
          },
          {
            status: 'preparing',
            changed_at: '2026-03-03 22:18:00',
            source: 'counter',
            note: '櫃台已轉交廚房製作'
          }
        ]
      }
    ],
    staffUsers: [
      {
        id: 'staff_super_admin_01',
        account: 'tako',
        password: 'tako1234',
        name: 'Tako',
        role: '',
        isSuperAdmin: true
      },
      {
        id: 'staff_manager_01',
        account: 'manager',
        password: 'manager123',
        name: '店長',
        role: 'manager'
      },
      {
        id: 'staff_deputy_01',
        account: 'deputy',
        password: 'deputy123',
        name: '副店長',
        role: 'deputy_manager'
      },
      {
        id: 'staff_counter_01',
        account: 'counter',
        password: 'counter123',
        name: '櫃台人員',
        role: 'counter'
      },
      {
        id: 'staff_kitchen_01',
        account: 'kitchen',
        password: 'kitchen123',
        name: '廚房人員',
        role: 'kitchen'
      }
    ],
    staffSession: null,
    visitorStatsDaily: [],
    auditClosings: {},
    auditHistory: [],
    nextIds: {
      cartItem: 3,
      order: 2,
      menuItem: 1,
      category: 1,
      table: 2,
      optionGroup: 1,
      option: 1,
      auditClose: 1,
      guestSession: 1
    }
  }
}

function normalizeState(raw = {}) {
  const defaults = createDefaultState()

  return {
    ...defaults,
    ...raw,
    tables: { ...defaults.tables, ...(raw.tables || {}) },
    categories: Array.isArray(raw.categories) ? raw.categories : defaults.categories,
    items: Array.isArray(raw.items) ? raw.items : defaults.items,
    cartsByTable: { ...defaults.cartsByTable, ...(raw.cartsByTable || {}) },
    guestOrderingSessionsByTable: {
      ...defaults.guestOrderingSessionsByTable,
      ...(raw.guestOrderingSessionsByTable || {})
    },
    activeOrderingByTable: {
      ...defaults.activeOrderingByTable,
      ...(raw.activeOrderingByTable || {})
    },
    orders: Array.isArray(raw.orders)
      ? raw.orders.map(order => ({
          ...order,
          payment_method: order.payment_method || (order.payment_status === 'paid' ? 'cash' : 'unpaid')
        }))
      : defaults.orders,
    staffUsers: Array.isArray(raw.staffUsers) ? raw.staffUsers : defaults.staffUsers,
    staffSession: raw.staffSession || defaults.staffSession,
    visitorStatsDaily: Array.isArray(raw.visitorStatsDaily) ? raw.visitorStatsDaily : defaults.visitorStatsDaily,
    auditClosings: { ...defaults.auditClosings, ...(raw.auditClosings || {}) },
    auditHistory: Array.isArray(raw.auditHistory) ? raw.auditHistory : defaults.auditHistory,
    nextIds: { ...defaults.nextIds, ...(raw.nextIds || {}) }
  }
}

function loadState() {
  if (typeof window === 'undefined') {
    return createDefaultState()
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) {
      const initial = createDefaultState()
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(initial))
      return initial
    }

    return normalizeState(JSON.parse(raw))
  } catch (error) {
    console.warn('[DineCoreMockApi] failed to load state, reset to defaults', error)
    return createDefaultState()
  }
}

let state = loadState()

function persistState() {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
}

export async function waitForMock(ms = 120) {
  await wait(ms)
}

export function cloneMockValue(value) {
  return cloneValue(value)
}

export function readMockState(reader) {
  return reader(state)
}

export function writeMockState(writer) {
  const result = writer(state)
  persistState()
  return result
}

export function ensureMockTable(targetState, tableCode) {
  const table = targetState.tables[tableCode]
  if (!table) {
    throw new Error('TABLE_NOT_FOUND')
  }

  return table
}
