import { createApp } from 'vue'
import App from './App.vue'
import { loadProjectConfig } from '../projects/loadProject.js'
import { discoverModules } from '../projects/moduleDiscovery.js'
import { createAppRouter } from './router/index.js'
import { getProjectModuleRegistry } from '../projects/modulesRegistry.js'
import { container } from './app/container/container.js'
import { createRegister } from './app/container/register.js'
import { coreStoreFactories } from './app/stores/index.js'

async function boot() {
  const register = createRegister(container)
  for (const [name, factory] of Object.entries(coreStoreFactories)) {
    register.store(name, factory)
  }

  const projectConfig = await loadProjectConfig()
  const discoveredModules = discoverModules(projectConfig)
  const registry = getProjectModuleRegistry(projectConfig?.name)

  console.log('[World] project =', projectConfig)
  console.log('[World] discovered modules =', discoveredModules)

  const allowList = discoveredModules.map(entry => entry.name)
  if (registry?.installModules) {
    await registry.installModules({ register, container }, { allowList })
  }

  const routes = registry?.buildModuleRoutes
    ? registry.buildModuleRoutes().routes
    : []

  const lifecycleStore = container.resolve('lifecycle')
  lifecycleStore.setPhase('ready')
  const moduleStore = container.resolve('module')
  moduleStore.setModules(allowList)

  const router = createAppRouter({ routes })

  createApp(App, {
    projectConfig,
    discoveredModules
  })
    .use(router)
    .mount('#app')
}

boot()
