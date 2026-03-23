import { discoverModules } from '../../../projects/moduleDiscovery.js'
import { getProjectModuleRegistry } from '../../../projects/modulesRegistry.js'
import { resolveWorldVisibility } from '@/core'
import { container } from '../container/container.js'
import { createRegister } from '../container/register.js'

export async function boot({ projectConfig } = {}) {
  await assertPlatformBoundary()
  syncPlatformConfig(projectConfig)

  const { discoveredModules, allowList } = await resolveBootVisibility(projectConfig)
  await registerAllowedModules(projectConfig, allowList)
  await initModules()
  await enterRuntime(allowList)

  return {
    appProps: {
      discoveredModules
    }
  }
}

async function assertPlatformBoundary() {
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
  await registry.installModules({ register, container }, { allowList })
}

async function initModules() {
}

async function enterRuntime(allowList) {
  const lifecycleStore = container.resolve('lifecycle')
  lifecycleStore.setPhase('ready')

  const moduleStore = container.resolve('module')
  moduleStore.setModules(allowList ?? [])
}
