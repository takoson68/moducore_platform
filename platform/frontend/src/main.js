import { createApp } from 'vue'
import App from './App.vue'
import { loadProjectConfig } from '../projects/loadProject.js'
import { discoverModules } from '../projects/moduleDiscovery.js'
import { createAppRouter } from './router/index.js'
import { getProjectModuleRegistry } from '../projects/modulesRegistry.js'
import { container } from './app/container/container.js'
import { createRegister } from './app/container/register.js'

async function boot() {
  const projectConfig = await loadProjectConfig()
  const discoveredModules = discoverModules(projectConfig)
  const registry = getProjectModuleRegistry(projectConfig?.name)

  console.log('[World] project =', projectConfig)
  console.log('[World] discovered modules =', discoveredModules)

  if (registry?.installModules) {
    const allowList = discoveredModules.map(entry => entry.name)
    const register = createRegister(container)
    await registry.installModules({ register, container }, { allowList })
  }

  const routes = registry?.buildModuleRoutes
    ? registry.buildModuleRoutes().routes
    : []

  const router = createAppRouter({ routes })

  createApp(App, {
    projectConfig,
    discoveredModules
  })
    .use(router)
    .mount('#app')
}

boot()
