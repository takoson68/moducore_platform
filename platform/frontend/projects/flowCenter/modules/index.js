import world from '@/world.js'

const modules = import.meta.glob('./*/index.js')

export const moduleLoaders = Object.fromEntries(
  Object.entries(modules)
    .filter(([path]) => !path.includes('/_archive/'))
    .map(([path, loader]) => {
      const name = path.split('/')[1]
      return [name, loader]
    })
)

const loadedModules = new Map()
const installedModules = new Set()

export async function loadModules() {
  for (const [name, loader] of Object.entries(moduleLoaders)) {
    if (loadedModules.has(name)) continue
    if (typeof loader !== 'function') continue

    const imported = await loader()
    loadedModules.set(name, imported?.default || null)
  }

  return loadedModules
}

export function listModules() {
  return Object.keys(moduleLoaders).map((name) => ({ name }))
}

export async function installModules({ register }, { allowList = [] } = {}) {
  const modulesMap = await loadModules()
  const allowSet = Array.isArray(allowList) ? new Set(allowList) : null

  for (const [name, mod] of modulesMap.entries()) {
    if (!mod) continue
    if (allowSet && !allowSet.has(name)) continue
    if (installedModules.has(name)) continue

    const setup = mod.setup || {}
    if (setup.stores && typeof setup.stores === 'object') {
      Object.entries(setup.stores).forEach(([storeName, factory]) => {
        if (!storeName || typeof factory !== 'function') return
        register.store(storeName, factory)
      })
    }

    if (Array.isArray(setup.routes)) {
      register.routes(setup.routes)
    }

    if (setup.ui?.slots && typeof setup.ui.slots === 'object') {
      Object.entries(setup.ui.slots).forEach(([slotName, descriptor]) => {
        if (Array.isArray(descriptor)) {
          descriptor.forEach((item) => world.registerUISlot(slotName, item))
        } else {
          world.registerUISlot(slotName, descriptor)
        }
      })
    }

    installedModules.add(name)
  }
}

export function buildModuleRoutes() {
  const bucket = window.__MODULE_ROUTES__ || { all: [] }
  return {
    routes: [...(bucket.all || [])]
  }
}
