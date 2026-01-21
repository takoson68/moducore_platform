// src/app/container/container.js
import { services } from './services/index.js'

class Container {
  constructor() {
    // 已註冊的 store factory
    this.factories = new Map()

    // 已建立的 store instance
    this.instances = new Map()

    // 平台 services（能力）
    this.services = services
  }

  /**
   * 註冊 store（factory）
   */
  register(name, factory) {
    if (this.factories.has(name)) {
      console.warn(`[Container] "${name}" already registered`)
      return
    }
    this.factories.set(name, factory)
  }

  /**
   * 取得 store（lazy）
   */
  resolve(name) {
    if (this.instances.has(name)) {
      return this.instances.get(name)
    }

    const factory = this.factories.get(name)
    if (!factory) {
      throw new Error(`[Container] "${name}" not registered`)
    }

    const instance = factory()
    this.instances.set(name, instance)
    return instance
  }

  /**
   * 取得平台 service
   */
  getService(name) {
    const service = this.services[name]
    if (!service) {
      throw new Error(`[Container] service "${name}" not found`)
    }
    return service
  }

  /**
   * Debug 用
   */
  list() {
    return {
      stores: [...this.factories.keys()],
      instances: [...this.instances.keys()],
      services: Object.keys(this.services),
    }
  }
}

export const container = new Container()
