import { normalizePath } from '@/router/routes.js'

export function createRegister(container) {
  function validateAccessMeta(meta = {}) {
    const access = meta.access || {}
    const publicFlag = typeof access.public === 'boolean' ? access.public : meta.public
    const authFlag = typeof access.auth === 'boolean' ? access.auth : meta.auth
    const hasPublic = typeof publicFlag === 'boolean'
    const hasAuth = typeof authFlag === 'boolean'

    if (!hasPublic || !hasAuth) {
      throw new Error('[Routes] meta.public/meta.auth are required')
    }

    const isPublic = publicFlag === true
    const isAuth = authFlag === true

    if (isPublic && meta.auth === false) {
      throw new Error('[Routes] meta { public: true, auth: false } is not allowed')
    }

    return { isPublic, isAuth }
  }

  function flattenRoutes(routes = [], parentPath = '') {
    const list = []

    routes.forEach((route) => {
      if (!route || typeof route !== 'object') return

      const path = route.path || ''
      const normalizedParent = parentPath ? normalizePath(parentPath).replace(/\/$/, '') : ''
      const isAbsolute = path.startsWith('/')
      const fullPath = isAbsolute
        ? path
        : normalizePath(normalizedParent ? `${normalizedParent}/${path}` : path)

      const meta = route.meta ? { ...route.meta } : {}
      if (parentPath) {
        meta.navParent = normalizedParent || null
      }

      const metaChildren = Array.isArray(meta.child) ? meta.child : []
      if (meta.child) {
        delete meta.child
      }

      const { children, ...rest } = route
      const combinedChildren = [
        ...(Array.isArray(children) ? children : []),
        ...metaChildren,
      ]

      const entry = { ...rest, path: fullPath, meta, __hasChildren: combinedChildren.length > 0 }
      list.push(entry)

      if (combinedChildren.length > 0) {
        list.push(...flattenRoutes(combinedChildren, fullPath))
      }
    })

    return list
  }

  function classifyMissingComponentRoute(route, accessInfo) {
    const hasComponent = Boolean(route?.component)
    const hasRedirect = typeof route?.redirect !== 'undefined'
    const hasChildren = route?.__hasChildren === true
    const isDisabled = accessInfo?.isPublic !== true && accessInfo?.isAuth !== true

    if (hasComponent) return null
    if (hasRedirect) return 'redirect'
    if (hasChildren) return 'group'
    if (isDisabled) return 'disabled'
    return 'warn'
  }

  function logMissingComponentDiagnostic(route, category) {
    if (!category) return
    const path = route?.path || '(unknown)'
    const message = `[Route][${category}] missing explicit component: ${path}`

    if (category === 'warn') {
      console.warn(message)
      return
    }

    console.debug(message)
  }

  function resolveRegisteredRoutes(routes = []) {
    const flatRoutes = flattenRoutes(routes)
    const getOrder = (route) => {
      const meta = route?.meta || {}
      return Number.isFinite(meta.order) ? meta.order : 0
    }

    const sortedRoutes = [...flatRoutes].sort((a, b) => {
      const orderDiff = getOrder(a) - getOrder(b)
      if (orderDiff !== 0) return orderDiff
      return String(a.path || '').localeCompare(String(b.path || ''))
    })

    return sortedRoutes.filter((route) => {
      const { isPublic, isAuth } = validateAccessMeta(route.meta || {})
      const category = classifyMissingComponentRoute(route, { isPublic, isAuth })
      logMissingComponentDiagnostic(route, category)
      return isPublic || isAuth
    })
  }

  return {
    store(name, factory) {
      container.register(name, factory, { scope: 'module' })
    },

    routes(routes = [], { moduleName = 'anonymous' } = {}) {
      if (!Array.isArray(routes) || routes.length === 0) return

      const resolvedRoutes = resolveRegisteredRoutes(routes)

      resolvedRoutes.forEach((route) => {
        container.registerRoute(moduleName, route)
      })

      container.emit('routes-updated', {
        moduleName,
        resolvedRoutes,
      })
    },
  }
}
