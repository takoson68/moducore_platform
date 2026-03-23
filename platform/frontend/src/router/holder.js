//- src/router/holder.js
let _router = null
let _routerCleanup = null

export function setRouter(router, cleanup = null) {
  if (typeof _routerCleanup === 'function') {
    _routerCleanup()
  }

  _router = router
  _routerCleanup = typeof cleanup === 'function' ? cleanup : null
}

export function getRouter() {
  if (!_router) {
    throw new Error('[RouterHolder] router not ready')
  }
  return _router
}
