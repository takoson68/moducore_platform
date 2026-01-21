let _router = null

export function setRouter(router) {
  _router = router
}

export function getRouter() {
  if (!_router) {
    throw new Error('[RouterHolder] router not ready')
  }
  return _router
}
