class Container {
  constructor() {
    this.factories = new Map()
    this.instances = new Map()
  }

  register(name, factory) {
    if (!name || typeof factory !== 'function') {
      throw new Error('[Container] register requires name and factory')
    }
    if (this.factories.has(name)) {
      console.warn(`[Container] "${name}" already registered`)
      return
    }
    this.factories.set(name, factory)
  }

  resolve(name) {
    if (this.instances.has(name)) {
      return this.instances.get(name)
    }
    const factory = this.factories.get(name)
    if (!factory) {
      throw new Error(`[Container] "${name}" is not registered`)
    }
    const instance = factory()
    this.instances.set(name, instance)
    return instance
  }

  list() {
    return Array.from(this.factories.keys())
  }
}

export const container = new Container()
