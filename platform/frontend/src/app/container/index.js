//- src/app/container/index.js
import { container } from './container.js'

export { container }

export function registerStore(name, factory, options = {}) {
  container.register(name, factory, { scope: 'core', ...options })
}

export function resolveStore(name) {
  return container.resolve(name)
}

export function resolveService(name) {
  return container.getService(name)
}

export function registerRoute(moduleName, route) {
  container.registerRoute(moduleName, route)
}

export function subscribeContainer(event, handler) {
  return container.subscribe(event, handler)
}

export function emitContainer(event, payload) {
  container.emit(event, payload)
}

export function listRoutes() {
  return container.getRoutes()
}

export function resetRoutes() {
  container.resetRoutes()
}

export function unregisterStore(name) {
  container.unregister(name)
}

export function resetModuleFactories() {
  container.resetModuleFactories()
}

export function resetContainer(options) {
  container.reset(options)
}

export function listStores() {
  return container.list().stores || []
}

export function listRegistry() {
  return container.list()
}
