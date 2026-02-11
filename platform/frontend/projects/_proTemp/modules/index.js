//- projects/_proTemp/modules/index.js
import { registerUISlot } from '@app/uiRegistry.js'

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
  return Object.keys(moduleLoaders).map(name => ({ name }))
}

export async function installModules({ register }, { allowList = [] } = {}) {
  const modulesMap = await loadModules()
  const allowSet = Array.isArray(allowList) ? new Set(allowList) : null

  for (const [name, mod] of modulesMap.entries()) {
    if (!mod) continue
    if (allowSet && !allowSet.has(name)) continue
    if (installedModules.has(name)) continue

    const setup = mod.setup || {}
    const { stores, routes, ui } = setup

    if (stores) {
      for (const [key, factory] of Object.entries(stores)) {
        register.store(key, factory)
      }
    }

    if (Array.isArray(routes)) {
      const resolvedRoutes = routes.map(route => {
        if (route && !route.component) {
          return { ...route, component: mod.view }
        }
        return route
      })
      register.routes(resolvedRoutes)
    }

    if (ui?.slots && typeof ui.slots === 'object') {
      for (const [slotName, descriptor] of Object.entries(ui.slots)) {
        if (Array.isArray(descriptor)) {
          descriptor.forEach(item => registerUISlot(slotName, item))
        } else {
          registerUISlot(slotName, descriptor)
        }
      }
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
