//- projects/project-b/modules/index.js
import { registerUISlot } from '@app/uiRegistry.js'

// 掃描同層模組目錄（每個模組需有 index.js）
const modules = import.meta.glob('./*/index.js')

// 建立 { moduleName: loader } 對照表（排除 _archive）
export const moduleLoaders = Object.fromEntries(
  Object.entries(modules)
    .filter(([path]) => !path.includes('/_archive/'))
    .map(([path, loader]) => {
      const name = path.split('/')[1]
      return [name, loader]
    })
)

// 已載入模組（name -> module）
const loadedModules = new Map()
// 已安裝（註冊過）的模組集合
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
  // 只回傳可被發現的模組名稱
  return Object.keys(moduleLoaders).map(name => ({ name }))
}

export async function installModules({ register }, { allowList = [] } = {}) {
  // 依 allowList 安裝模組（註冊 store / routes / ui slots）
  const modulesMap = await loadModules()
  const allowSet = Array.isArray(allowList) ? new Set(allowList) : null

  for (const [name, mod] of modulesMap.entries()) {
    if (!mod) continue
    if (allowSet && !allowSet.has(name)) continue
    if (installedModules.has(name)) continue

    const setup = mod.setup || {}
    const { stores, routes, ui } = setup

    if (stores) {
      // 註冊模組 store
      for (const [key, factory] of Object.entries(stores)) {
        register.store(key, factory)
      }
    }

    if (Array.isArray(routes)) {
      // 若 route 未指定 component，預設使用模組 view
      const resolvedRoutes = routes.map(route => {
        if (route && !route.component) {
          return { ...route, component: mod.view }
        }
        return route
      })
      register.routes(resolvedRoutes)
    }

    if (ui?.slots && typeof ui.slots === 'object') {
      // 註冊 UI slot（支援單一或多個 descriptor）
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
  // 由全域 bucket 組裝路由清單
  const bucket = window.__MODULE_ROUTES__ || { all: [] }
  return {
    routes: [...(bucket.all || [])]
  }
}
