import { container, registerStore, resolveStore, resolveService, listStores, listRegistry } from './app/container/index.js'
import { coreStoreFactories } from './app/stores/index.js'
import { createStore as createCoreStore } from './app/stores/_storeFactory.js'
import { registerUISlot } from './app/uiRegistry.js'
import { loadProjectConfig } from '../projects/loadProject.js'
import { initApi, http, authApi } from './app/api/index.js'
import { getApiMode } from './app/api/apiMode.js'
import { boot } from './app/boot/boot.js'
import { createAppRouter } from './router/index.js'
import { setRouter } from './router/holder.js'

class World {
  constructor() {
    this.started = false
    this._startPromise = null
    this._coreRegistered = false

    this._http = null
    this._context = null

    this._router = null
    this._appProps = {}
    this._projectConfig = null

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

  async start() {
    if (this.started) return
    if (this._startPromise) return this._startPromise

    this._startPromise = (async () => {
      this._registerCoreStores()

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
        projectName: import.meta.env.VITE_PROJECT || projectConfig?.name
      })

      const { appProps } = await boot({ projectConfig })
      const { router, cleanup } = await createAppRouter()
      setRouter(router, cleanup)

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

  _registerCoreStores() {
    if (this._coreRegistered) return

    for (const [name, factory] of Object.entries(coreStoreFactories)) {
      registerStore(name, factory)
    }

    this._coreRegistered = true
  }

  _ensureStarted() {
    if (!this.started && !this._startPromise) {
      throw new Error('World not started')
    }
  }

  async reset() {
    this._ensureStarted()

    const lifecycleStore = resolveStore('lifecycle')
    lifecycleStore.setPhase('booting')

    const moduleStore = resolveStore('module')
    if (typeof moduleStore.clearAll === 'function') {
      moduleStore.clearAll()
    } else {
      moduleStore.clear?.()
    }

    const platformConfigStore = resolveStore('platformConfig')
    if (typeof platformConfigStore.reset === 'function') {
      platformConfigStore.reset()
    } else {
      platformConfigStore.clear?.()
    }

    const authStore = resolveStore('auth')
    if (typeof authStore.resetUserContext === 'function') {
      authStore.resetUserContext()
    } else {
      authStore.logout?.()
    }

    container.reset()

    const { appProps } = await boot({ projectConfig: this._projectConfig })
    this._appProps = appProps
  }

  dispose() {
    container.destroy()
    setRouter(null)

    this.started = false
    this._startPromise = null
    this._coreRegistered = false
    this._http = null
    this._context = null
    this._router = null
    this._appProps = {}
    this._projectConfig = null
  }

  http() {
    this._ensureStarted()
    return this._http || http
  }

  authApi() {
    this._ensureStarted()
    return authApi
  }

  apiMode() {
    this._ensureStarted()
    return getApiMode()
  }

  getContext() {
    if (!this._context) return null
    return Object.freeze({ ...this._context })
  }

  store(name) {
    this._ensureStarted()
    return resolveStore(name)
  }

  hasStore(name) {
    this._ensureStarted()
    return listStores().includes(name)
  }

  list() {
    this._ensureStarted()
    return listRegistry()
  }

  service(name) {
    this._ensureStarted()
    return resolveService(name)
  }

  appProps() {
    this._ensureStarted()
    return this._appProps
  }

  projectConfig() {
    this._ensureStarted()
    return this._projectConfig
  }

  router() {
    this._ensureStarted()
    return this._router
  }

  createStore(options) {
    return createCoreStore(options)
  }

  registerUISlot(slotName, descriptor) {
    registerUISlot(slotName, descriptor)
  }
}

export default new World()
