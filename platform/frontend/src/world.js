import { registerStore, resolveStore, resolveService, listStores, listRegistry } from './app/container/index.js'
import { coreStoreFactories } from './app/stores/index.js'
import { createStore as createCoreStore } from './app/stores/_storeFactory.js'
import { registerUISlot } from './app/uiRegistry.js'
import { loadProjectConfig } from '../projects/loadProject.js'
import { initApi, http, authApi } from './app/api/index.js'
import { getApiMode } from './app/api/apiMode.js'
import { boot } from './app/boot/boot.js'
import { createAppRouter } from './router/index.js'
import { setRouter } from './router/holder.js'

/**
 * World 是平台前端的唯一 runtime 門面（Facade）。
 *
 * 設計目標：
 * - 對外統一提供 store / service / router / api 等能力
 * - 隱藏 container 與啟動流程細節，避免工程層直接依賴底層實作
 * - 保證啟動順序與初始化時機一致
 *
 * 使用約定：
 * 1. 應先執行 `await world.start()`
 * 2. 啟動後再呼叫其他方法（`store/service/http/...`）
 */
class World {
  constructor() {
    this.started = false
    this._startPromise = null

    this._http = null
    this._context = null

    this._router = null
    this._appProps = {}
    this._projectConfig = null

    // 非 breaking 代理：支援 world.services.xxx()
    // 等價於 world.service('xxx')，並保留未來擴充空間。
    this.services = new Proxy({}, {
      get: (_, prop) => {
        if (typeof prop !== 'string') return undefined

        return (...args) => {
          let service
          try {
            service = this.service(prop)
          } catch (error) {
            throw new Error(`[World.services] service "${prop}" not found`, { cause: error })
          }

          if (typeof service === 'function') {
            return service(...args)
          }

          if (args.length > 0) {
            throw new Error(`[World.services] service "${prop}" is not callable`)
          }

          return service
        }
      }
    })
  }

  /**
   * 啟動世界（可重入、具去重能力）。
   * - 已啟動：直接返回
   * - 啟動中：返回同一個 Promise，避免重複初始化
   * - 首次啟動：註冊核心 stores、載入 project config、啟動 boot 與 router
   */
  async start() {
    if (this.started) return
    if (this._startPromise) return this._startPromise

    this._startPromise = (async () => {
      for (const [name, factory] of Object.entries(coreStoreFactories)) {
        registerStore(name, factory)
      }

      const projectConfig = await loadProjectConfig()
      const hasWindow = typeof window !== 'undefined'
      const locationLike = hasWindow ? window.location : null
      this._context = {
        isServer: !hasWindow,
        url: locationLike
          ? `${locationLike.pathname || ''}${locationLike.search || ''}${locationLike.hash || ''}`
          : '',
        host: locationLike?.hostname || '',
        headers: {},
        initialState: null,
        projectName: import.meta.env.VITE_PROJECT || projectConfig?.name || null
      }

      initApi({
        // 以 VITE_PROJECT 作為 X-Project 來源，避免依賴網域判斷
        projectName: import.meta.env.VITE_PROJECT || projectConfig?.name
      })

      const { appProps } = await boot({ projectConfig })
      const router = await createAppRouter()
      setRouter(router)

      this._http = http
      this._appProps = appProps
      this._projectConfig = projectConfig
      this._router = router
      this.started = true
    })()

    try {
      await this._startPromise
    } finally {
      this._startPromise = null
    }
  }

  /**
   * 內部保護：確保 world 已進入可用狀態。
   * 尚未啟動時呼叫其他方法會直接拋錯，避免隱性時序問題。
   */
  _ensureStarted() {
    if (!this.started && !this._startPromise) {
      throw new Error('World not started')
    }
  }

  /**
   * 取得 HTTP 客戶端。
   */
  http() {
    this._ensureStarted()
    return this._http || http
  }

  /**
   * 取得認證 API 聚合物件（login/logout/session...）。
   */
  authApi() {
    this._ensureStarted()
    return authApi
  }

  /**
   * 取得目前 API 模式（例如 mock / real）。
   */
  apiMode() {
    this._ensureStarted()
    return getApiMode()
  }

  /**
   * 取得唯讀的 runtime context 快照（供 Test / SSR / Security Audit 觀測使用）。
   * 回傳值為 shallow copy 並以 Object.freeze() 凍結，避免外部修改 World 內部 context。
   * 不會回傳原始 this._context 物件。
   */
  getContext() {
    if (!this._context) return null
    return Object.freeze({ ...this._context })
  }

  /**
   * 取得指定 store 實例。
   * @param {string} name store 名稱
   */
  store(name) {
    this._ensureStarted()
    return resolveStore(name)
  }

  /**
   * 檢查指定 store 是否已被註冊。
   * @param {string} name store 名稱
   * @returns {boolean}
   */
  hasStore(name) {
    this._ensureStarted()
    return listStores().includes(name)
  }

  /**
   * 列出目前世界可見的 registry 資訊（stores / instances / services）。
   * 主要用於除錯、診斷與可觀測性。
   */
  list() {
    this._ensureStarted()
    return listRegistry()
  }

  /**
   * 取得指定平台 service。
   * @param {string} name service 名稱
   */
  service(name) {
    this._ensureStarted()
    return resolveService(name)
  }

  /**
   * 取得啟動階段產生的 app props（提供給根組件）。
   */
  appProps() {
    this._ensureStarted()
    return this._appProps
  }

  /**
   * 取得目前 project 設定。
   */
  projectConfig() {
    this._ensureStarted()
    return this._projectConfig
  }

  /**
   * 取得應用 router 實例。
   */
  router() {
    this._ensureStarted()
    return this._router
  }

  /**
   * 專案層建立 store 的唯一入口（包覆核心 store factory）。
   */
  createStore(options) {
    return createCoreStore(options)
  }

  /**
   * 專案層註冊 UI slot 的唯一入口（包覆 UI registry）。
   */
  registerUISlot(slotName, descriptor) {
    registerUISlot(slotName, descriptor)
  }
}

export default new World()
