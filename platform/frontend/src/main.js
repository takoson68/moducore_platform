import { createApp } from 'vue'
import App from './App.vue'
import { boot } from './app/boot/boot.js'
import { createAppRouter } from './router/index.js'
import { setRouter } from './router/holder.js'
import { container } from './app/container/container.js'
import { coreStoreFactories } from './app/stores/index.js'
import { loadProjectConfig } from '../projects/loadProject.js'
import { initApi } from './app/api/index.js'

async function start() {
  for (const [name, factory] of Object.entries(coreStoreFactories)) {
    container.register(name, factory)
  }

  const projectConfig = await loadProjectConfig()
  initApi({
    // 以 VITE_PROJECT 作為 X-Project 來源，避免依賴網域判斷
    projectName: import.meta.env.VITE_PROJECT || projectConfig?.name
  })
  const { appProps } = await boot({ projectConfig })
  const router = await createAppRouter()
  setRouter(router)
  
  createApp(App, {
    ...appProps,
    projectConfig
  })
    .use(router)
    .mount('#app')
}

start()
