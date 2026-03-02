export function resolveFlowRouteAccess(meta = {}) {
  const access = meta.access || {}
  // `identityAccess` 是登入後的細粒度身份授權 schema。
  // 它不負責判定「有沒有登入」，只負責判定「登入後是否符合角色 / 公司限制」。
  const identityAccess = meta.identityAccess || {}

  return {
    public: typeof access.public === 'boolean' ? access.public : meta.public === true,
    auth: typeof access.auth === 'boolean' ? access.auth : meta.auth === true,
    roles: Array.isArray(identityAccess.roles) ? identityAccess.roles : [],
    includeCompanies: Array.isArray(identityAccess.includeCompanies) ? identityAccess.includeCompanies : [],
    excludeCompanies: Array.isArray(identityAccess.excludeCompanies) ? identityAccess.excludeCompanies : []
  }
}

export function canAccessFlowRoute(routeLike, user) {
  const meta = routeLike?.meta || routeLike || {}
  const rules = resolveFlowRouteAccess(meta)
  const isLoggedIn = Boolean(user)

  if (!isLoggedIn) {
    return rules.public === true
  }

  if (rules.auth !== true && rules.public !== true) {
    return false
  }

  if (rules.roles.length > 0 && !rules.roles.includes(user.role)) {
    return false
  }

  if (rules.includeCompanies.length > 0 && !rules.includeCompanies.includes(user.company_id)) {
    return false
  }

  if (rules.excludeCompanies.includes(user.company_id)) {
    return false
  }

  return true
}

export function filterAccessibleFlowRoutes(routes = [], user) {
  return routes.filter((route) => canAccessFlowRoute(route, user))
}

export function findFlowFallbackPath(routes = [], user) {
  return filterAccessibleFlowRoutes(routes, user)[0]?.path || '/'
}
