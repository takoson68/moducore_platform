import { container } from './container.js'

export function createRegister(target = container) {
  return {
    store(name, factory) {
      target.register(name, factory)
    },
    routes(routes) {
      if (!Array.isArray(routes)) return
      const bucket = window.__MODULE_ROUTES__ || { all: [] }
      bucket.all.push(...routes)
      window.__MODULE_ROUTES__ = bucket
    }
  }
}
