//- src/app/container/container.js
import { services } from './services/index.js'

class Container {
  constructor() {
    this.coreFactories = new Map()
    this.moduleFactories = new Map()
    this.instances = new Map()
    this.services = services
    this.routes = new Map()
    this.listeners = new Map()
  }

  register(name, factory, { scope = 'module' } = {}) {
    if (typeof factory !== 'function') {
      throw new TypeError(`[Container] "${name}" factory must be a function`)
    }

    if (scope !== 'core' && scope !== 'module') {
      throw new Error(`[Container] invalid scope "${scope}"`)
    }

    if (scope === 'core') {
      if (this.coreFactories.has(name)) {
        throw new Error(`[Container] core factory "${name}" already registered`)
      }

      this.coreFactories.set(name, factory)
      return
    }

    if (this.moduleFactories.has(name)) {
      this.disposeInstance(name)
    }

    this.moduleFactories.set(name, factory)
  }

  resolve(name) {
    if (this.instances.has(name)) {
      return this.instances.get(name)
    }

    const factory = this.coreFactories.get(name) || this.moduleFactories.get(name)
    if (!factory) {
      throw new Error(`[Container] "${name}" not registered`)
    }

    const instance = factory()
    this.instances.set(name, instance)
    return instance
  }

  unregister(name) {
    const removedModuleFactory = this.moduleFactories.delete(name)
    const removedCoreFactory = this.coreFactories.delete(name)

    if (removedModuleFactory || removedCoreFactory) {
      this.disposeInstance(name)
    }
  }

  getService(name) {
    const service = this.services[name]
    if (!service) {
      throw new Error(`[Container] service "${name}" not found`)
    }
    return service
  }

  registerRoute(moduleName, route) {
    const key = String(moduleName || 'anonymous')
    if (!route || typeof route !== 'object') return

    if (!this.routes.has(key)) {
      this.routes.set(key, [])
    }

    this.routes.get(key).push(route)
  }

  getRoutes() {
    return [...this.routes.values()].flat()
  }

  resetRoutes() {
    this.routes.clear()
    this.emit('routes-reset')
  }

  subscribe(event, handler) {
    if (typeof handler !== 'function') {
      throw new TypeError(`[Container] listener for "${event}" must be a function`)
    }

    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set())
    }

    const handlers = this.listeners.get(event)
    handlers.add(handler)

    return () => {
      handlers.delete(handler)
      if (handlers.size === 0) {
        this.listeners.delete(event)
      }
    }
  }

  emit(event, payload) {
    const handlers = this.listeners.get(event)
    if (!handlers || handlers.size === 0) return

    for (const handler of [...handlers]) {
      try {
        handler(payload)
      } catch (error) {
        console.error(`[Container] listener for "${event}" failed`, error)
      }
    }
  }

  resetModuleFactories() {
    for (const name of this.moduleFactories.keys()) {
      this.disposeInstance(name)
    }

    this.moduleFactories.clear()
  }

  reset({ clearCoreFactories = false } = {}) {
    this.instances.forEach((instance, name) => {
      if (!clearCoreFactories && this.coreFactories.has(name)) return
      if (typeof instance.dispose === 'function') {
        instance.dispose()
      }
    })

    if (clearCoreFactories) {
      this.instances.clear()
      this.coreFactories.clear()
    } else {
      for (const name of [...this.instances.keys()]) {
        if (this.coreFactories.has(name)) continue
        this.instances.delete(name)
      }
    }

    this.resetRoutes()
    this.resetModuleFactories()
  }

  list() {
    return {
      stores: [...this.coreFactories.keys(), ...this.moduleFactories.keys()],
      coreStores: [...this.coreFactories.keys()],
      moduleStores: [...this.moduleFactories.keys()],
      instances: [...this.instances.keys()],
      services: Object.keys(this.services),
      routes: this.getRoutes(),
    }
  }

  destroy() {
    this.reset({ clearCoreFactories: true })
    this.listeners.clear()
  }

  disposeInstance(name) {
    const instance = this.instances.get(name)
    if (instance && typeof instance.dispose === 'function') {
      instance.dispose()
    }
    this.instances.delete(name)
  }
}

export const container = new Container()
