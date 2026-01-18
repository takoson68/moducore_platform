import { createApp } from 'vue'
import App from './App.vue'
import { loadProjectConfig } from '../projects/loadProject.js'
import { discoverModules } from '../projects/moduleDiscovery.js'

async function boot() {
  const projectConfig = await loadProjectConfig()
  const discoveredModules = discoverModules(projectConfig)

  console.log('[World] project =', projectConfig)
  console.log('[World] discovered modules =', discoveredModules)

  createApp(App, {
    projectConfig,
    discoveredModules
  }).mount('#app')
}

boot()
