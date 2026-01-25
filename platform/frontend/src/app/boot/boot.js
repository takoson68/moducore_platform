//- src/app/boot/boot.js
import { discoverModules } from '../../../projects/moduleDiscovery.js'
import { getProjectModuleRegistry } from '../../../projects/modulesRegistry.js'
import { container } from '../container/container.js'
import { createRegister } from '../container/register.js'
import { discoverLayout } from '../layout/discoverLayout.js'
import { layoutStore } from '../layout/layoutStore.js'

export async function boot({ projectConfig } = {}) {
  await assertPlatformBoundary()
  const { discoveredModules, allowList } = await resolveWorldVisibility(projectConfig)
  await registerAllowedModules(projectConfig, allowList)
  await initModules()
  await enterRuntime(allowList)
  exposeResetHook()

  return {
    appProps: {
      discoveredModules
    }
  }
}

// Phase A: assertPlatformBoundary
async function assertPlatformBoundary() {
  // TODO: 強制執行平台邊界檢查
}

// Phase B: resolveWorldVisibility （僅元數據，不註冊）
async function resolveWorldVisibility(projectConfig) {
  const layout = await discoverLayout(projectConfig)
  layoutStore.set(layout)

  let discoveredModules = discoverModules(projectConfig)
  if (!Array.isArray(discoveredModules) || discoveredModules.length === 0) {
    const declared = Array.isArray(projectConfig?.modules) ? projectConfig.modules : []
    discoveredModules = declared.map(name => ({ name, status: 'declared' }))
  }
  const allowList = discoveredModules.map(entry => entry.name)

  return { discoveredModules, allowList }
}

// Phase C: registerAllowedModules （僅使用 container.register）
async function registerAllowedModules(projectConfig, allowList) {
  const registry = getProjectModuleRegistry(projectConfig?.name)
  if (!registry?.installModules) {
    return
  }

  const register = createRegister(container)
  await registry.installModules({ register, container }, { allowList })
}

// Phase D: initModules
async function initModules() {
  // TODO: 初始化模組
}

// Phase E: enterRuntime
async function enterRuntime(allowList) {
  const lifecycleStore = container.resolve('lifecycle')
  lifecycleStore.setPhase('ready')

  const moduleStore = container.resolve('module')
  moduleStore.setModules(allowList ?? [])
}

// Phase F: 進入運行時
function exposeResetHook() {
  // TODO: 回復至初始值
}
