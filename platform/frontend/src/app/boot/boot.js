//- src/app/boot/boot.js
import { discoverModules } from '../../../projects/moduleDiscovery.js'
import { getProjectModuleRegistry } from '../../../projects/modulesRegistry.js'
import { container } from '../container/container.js'
import { createRegister } from '../container/register.js'

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
  // 此階段的存在意義：
  // - 確保平台層已就緒、世界邊界成立
  // - 若偵測到跨世界或容器未就緒，應在此中止啟動流程
  // 考慮到平台切換Project 切換（A → B），預留
}

// Phase B: resolveWorldVisibility （僅元數據，不註冊）
async function resolveWorldVisibility(projectConfig) {
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
  // 注意：
  // 模組初始化目前在 installModules 階段執行。 // /modules/index.js
  // 此階段僅作為保留掛點，用於未來：
  // - 延遲初始化
  // - 可重跑初始化
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
  // 此階段用途說明：
  // - 提供世界（World）重置 / 倒帶的統一入口
  // - 用於同一執行階段內的世界切換（例如：登出、SaaS 模式、多租戶切換、除錯工具）
  //
  // 設計說明：
  // - 目前建議 Project 切換採用「不同網域」並整頁 reload 的方式，
  //   瀏覽器本身即會清空 runtime，因此正常流程不會使用此 hook。
  // - 此段刻意保留，作為未來同 runtime 世界重置的擴充掛點。
}
