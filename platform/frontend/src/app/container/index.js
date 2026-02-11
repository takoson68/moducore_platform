//- src/app/container/index.js
import { container } from './container.js'

export { container }

export function registerStore(name, factory) {
  container.register(name, factory)
}

export function resolveStore(name) {
  return container.resolve(name)
}

export function resolveService(name) {
  return container.getService(name)
}

export function listStores() {
  return container.list().stores || []
}

export function listRegistry() {
  return container.list()
}
