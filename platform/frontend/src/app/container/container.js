//- src/app/container/container.js
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

  /**
   * 重置所有 Store 實例
   * 用於切換世界（Project）時，確保狀態完全清空
   */
  destroy() {
    // 1. 執行每個實例的清理邏輯（如果有）
    this.instances.forEach((instance) => {
      if (typeof instance.dispose === 'function') {
        instance.dispose()
      }
    })

    // 2. 清空實例緩存
    this.instances.clear()
    
    // 注意：factories (定義) 通常不需要清空，除非模組定義也會隨世界改變
  }


}

export const container = new Container()
