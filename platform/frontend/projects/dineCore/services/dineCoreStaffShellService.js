const staffRouteRegistry = [
  {
    key: 'counter',
    label: '櫃台訂單',
    path: '/staff/counter/orders',
    to: '/staff/counter/orders'
  },
  {
    key: 'counter-detail',
    label: '櫃台明細',
    path: '/staff/counter/orders/:orderId',
    to: orderId => `/staff/counter/orders/${orderId}`
  },
  {
    key: 'kitchen',
    label: '廚房看板',
    path: '/staff/kitchen/board',
    to: '/staff/kitchen/board'
  },
  {
    key: 'dashboard',
    label: '營運總覽',
    path: '/staff/manager/dashboard',
    to: '/staff/manager/dashboard',
    planned: true
  },
  {
    key: 'reports',
    label: '營運報表',
    path: '/staff/manager/reports',
    to: '/staff/manager/reports',
    planned: true
  },
  {
    key: 'visitor-stats',
    label: '每日 IP 訪客統計',
    path: '/staff/manager/visitor-stats',
    to: '/staff/manager/visitor-stats'
  },
  {
    key: 'audit-close',
    label: '關帳與稽核',
    path: '/staff/manager/audit-close',
    to: '/staff/manager/audit-close',
    planned: true
  },
  {
    key: 'menu-admin',
    label: '商品管理',
    path: '/staff/manager/menu-items',
    to: '/staff/manager/menu-items'
  },
  {
    key: 'table-admin',
    label: '桌位管理',
    path: '/staff/manager/tables',
    to: '/staff/manager/tables'
  }
]

function hasExactRoute(router, path) {
  return router.getRoutes().some(record => record.path === path)
}

function resolveRouteMeta(router, path) {
  const target = router.getRoutes().find(record => record.path === path)
  return target?.meta || {}
}

export function canAccessStaffRoute(router, path, session) {
  if (!session || !hasExactRoute(router, path)) return false

  const meta = resolveRouteMeta(router, path)
  if (meta?.superAdminOnly) {
    return Boolean(session.isSuperAdmin)
  }

  const roles = Array.isArray(meta?.staffRoles) ? meta.staffRoles : []
  if (roles.length === 0) return true

  return roles.includes(String(session.role || ''))
}

export function buildStaffNavItems(router, session, currentOrderId = '') {
  return staffRouteRegistry
    .filter(item => hasExactRoute(router, item.path))
    .filter(item => canAccessStaffRoute(router, item.path, session))
    .filter(item => !item.path.includes(':orderId'))
    .map(item => ({
      key: item.key,
      label: item.label,
      to: typeof item.to === 'function' ? item.to(currentOrderId) : item.to,
      disabled: Boolean(item.planned)
    }))
}

export function buildStaffDevLinks(router, currentOrderId = '') {
  return staffRouteRegistry
    .filter(item => hasExactRoute(router, item.path))
    .map(item => ({
      key: item.key,
      label: item.label,
      to: typeof item.to === 'function' ? item.to(currentOrderId) : item.to
    }))
}

export function resolveStaffLandingPath(router, session) {
  if (!session) return ''

  if (Boolean(session.isSuperAdmin) && hasExactRoute(router, '/staff/manager/visitor-stats')) {
    return '/staff/manager/visitor-stats'
  }

  const firstActiveItem = buildStaffNavItems(router, session)
    .find(item => !item.disabled)

  return firstActiveItem?.to || ''
}
