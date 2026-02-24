//- src/app/container/register.js
import { getRouter } from '@/router/holder.js'
import { normalizePath } from '@/router/routes.js'
// --------------------------------------------------
// Module Registration Facade
// --------------------------------------------------
// 這是「模組語言層」，不是 container 本體
// - 不做初始化
// - 不做流程
// - 不保存狀態
// --------------------------------------------------

export function createRegister(container) {
  // 用於收集各模組路由（依 public/auth 分桶）
  const ROUTE_BUCKET_KEY = '__MODULE_ROUTES__'
  function ensureRouteBucket() {
    if (!window[ROUTE_BUCKET_KEY]) {
      window[ROUTE_BUCKET_KEY] = { public: [], auth: [], all: [] }
    }
    return window[ROUTE_BUCKET_KEY]
  }

  function validateAccessMeta(meta = {}) {
    const access = meta.access || {}
    const publicFlag = typeof access.public === 'boolean' ? access.public : meta.public
    const authFlag = typeof access.auth === 'boolean' ? access.auth : meta.auth
    const hasPublic = typeof publicFlag === 'boolean'
    const hasAuth = typeof authFlag === 'boolean'
    if (!hasPublic || !hasAuth) {
      throw new Error('[Routes] meta.public/meta.auth 必須為布林值且不得缺少')
    }
    const isPublic = publicFlag === true
    const isAuth = authFlag === true

    if (isPublic && meta.auth === false) {
      throw new Error('[Routes] meta { public: true, auth: false } 不允許')
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
      const base = normalizedParent
      const fullPath = isAbsolute
        ? path
        : normalizePath(base ? `${base}/${path}` : path)

      const meta = route.meta ? { ...route.meta } : {}
      if (parentPath) {
        meta.navParent = normalizedParent || null
      }

      const metaChildren = Array.isArray(meta.child) ? meta.child : []
      if (meta.child) {
        delete meta.child
      }
      const { children, ...rest } = route
      const entry = { ...rest, path: fullPath, meta }
      list.push(entry)

      const combinedChildren = [
        ...(Array.isArray(children) ? children : []),
        ...metaChildren
      ]
      const hasChildren = combinedChildren.length > 0
      if (combinedChildren.length > 0) {
        list.push(...flattenRoutes(combinedChildren, fullPath))
      }
      entry.__hasChildren = hasChildren
    })
    return list
  }

  // 依 route 型別分級缺少 component 的診斷訊息，降低合法結構的警告噪音
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

  // 合法無 component route 用 debug；只有可疑漏寫才用 warn
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

  return {
    /**
     * 註冊模組 store
     */
    store(name, factory) {
      container.register(name, factory)
    },

    /**
     * 註冊模組 routes
     */
    routes(routes = [], { meta = {} } = {}) {
      if (!Array.isArray(routes) || routes.length === 0) return
      const bucket = ensureRouteBucket()
      const flatRoutes = flattenRoutes(routes)
      const pushRoute = (route) => {
        const { isPublic, isAuth } = validateAccessMeta(route.meta || {})
        const category = classifyMissingComponentRoute(route, { isPublic, isAuth })
        logMissingComponentDiagnostic(route, category)
        if (!isPublic && !isAuth) return // disabled route
        const target = isPublic ? bucket.public : bucket.auth
        target.push(route)
        bucket.all.push(route)
      }

      const getOrder = (route) => {
        const meta = route?.meta || {}
        const order = meta.order
        return Number.isFinite(order) ? order : 0
      }
      const sortedRoutes = [...flatRoutes].sort((a, b) => {
        const orderDiff = getOrder(a) - getOrder(b)
        if (orderDiff !== 0) return orderDiff
        return String(a.path || '').localeCompare(String(b.path || ''))
      })

      sortedRoutes.forEach(pushRoute)

      // 若 router 已建立，立即注入 children 到 root
      try {
        const router = getRouter()
        sortedRoutes.forEach(r => router.addRoute('root', r))
      } catch (err) {
        // router 尚未就緒時忽略
      }

      // 通知 UI/nav 重新取 routes
      window.dispatchEvent(new CustomEvent('moducore:routes-updated'))
    },

    /**
     * （未來）註冊 service
     */
    // service(name, factory) {
    //   container.registerService(name, factory)
    // },

    /**
     * （未來）註冊事件
     */
    // event(name, handler) {}
  }
}
