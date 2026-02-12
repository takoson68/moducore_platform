//- src/app/boot/boot.js
import { discoverModules } from '../../../projects/moduleDiscovery.js'
import { getProjectModuleRegistry } from '../../../projects/modulesRegistry.js'
import { resolveWorldVisibility } from '@/core'
import { container } from '../container/container.js'
import { createRegister } from '../container/register.js'

// 保留最後一次 boot 參數，讓 reset 可用相同專案上下文重啟。
let lastBootContext = { projectConfig: null }

export async function boot({ projectConfig } = {}) {
  // 先快照本次 boot 上下文，供 reset/restart 使用。
  lastBootContext = { projectConfig: projectConfig ?? null }

  await assertPlatformBoundary()
  // 在模組安裝與進入 runtime 前，先注入平台設定。
  syncPlatformConfig(projectConfig)

  // 先做可見性裁決，再只安裝允許模組。
  const { discoveredModules, allowList } = await resolveBootVisibility(projectConfig)
  await registerAllowedModules(projectConfig, allowList)
  await initModules()
  await enterRuntime(allowList)
  // 對外暴露 runtime reset 入口，供 host/除錯工具使用。
  exposeResetHook()

  return {
    appProps: {
      discoveredModules
    }
  }
}

async function assertPlatformBoundary() {
  // 保留：平台邊界檢查掛點。
}

async function resolveBootVisibility(projectConfig) {
  let discoveredModules = discoverModules(projectConfig)
  if (!Array.isArray(discoveredModules) || discoveredModules.length === 0) {
    const declared = Array.isArray(projectConfig?.modules) ? projectConfig.modules : []
    discoveredModules = declared.map((name) => ({ name, status: 'declared' }))
  }

  const authStore = container.resolve('auth')
  const userContext = typeof authStore.getUserContext === 'function'
    ? authStore.getUserContext()
    : { isAuthenticated: typeof authStore.isLoggedIn === 'function' ? authStore.isLoggedIn() : false }
  const visibleModules = resolveWorldVisibility({
    discovered: discoveredModules,
    platformConfig: projectConfig,
    userContext
  })
  const allowList = visibleModules.map((entry) => entry.name)

  return { discoveredModules, allowList }
}

function syncPlatformConfig(projectConfig) {
  const platformConfigStore = container.resolve('platformConfig')
  if (typeof platformConfigStore.setConfig === 'function') {
    platformConfigStore.setConfig(projectConfig ?? null)
  } else {
    platformConfigStore.set({ config: projectConfig ?? null })
  }
}

async function registerAllowedModules(projectConfig, allowList) {
  const registry = getProjectModuleRegistry(projectConfig?.name)
  if (!registry?.installModules) {
    return
  }

  const register = createRegister(container)
  // registry 會替每個允許模組完成 store/routes/ui 註冊。
  await registry.installModules({ register, container }, { allowList })
}

async function initModules() {
  // 保留：模組初始化掛點。
}

async function enterRuntime(allowList) {
  // 標記 runtime ready，並發布目前啟用模組清單給 UI/狀態層使用。
  const lifecycleStore = container.resolve('lifecycle')
  lifecycleStore.setPhase('ready')

  const moduleStore = container.resolve('module')
  moduleStore.setModules(allowList ?? [])
}

export function exposeResetHook() {
  const hook = () => resetWorld()
  if (typeof window !== 'undefined') {
    // 全域 reset hook：提供瀏覽器內診斷或 host 整合呼叫。
    window.__MODUCORE_RESET_WORLD__ = hook
  }
  return hook
}

export async function resetWorld() {
  // 重置順序：lifecycle -> module/platform/auth 狀態 -> container -> 重新 boot。
  const lifecycleStore = container.resolve('lifecycle')
  lifecycleStore.setPhase('booting')

  const moduleStore = container.resolve('module')
  if (typeof moduleStore.clearAll === 'function') {
    moduleStore.clearAll()
  } else {
    moduleStore.clear()
  }

  const platformConfigStore = container.resolve('platformConfig')
  if (typeof platformConfigStore.reset === 'function') {
    platformConfigStore.reset()
  } else {
    platformConfigStore.clear()
  }

  const authStore = container.resolve('auth')
  if (typeof authStore.resetUserContext === 'function') {
    authStore.resetUserContext()
  } else {
    authStore.logout?.()
  }

  container.destroy()
  await boot(lastBootContext)
}
