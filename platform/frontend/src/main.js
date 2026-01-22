import { createApp } from 'vue'
import App from './App.vue'
import { boot } from './app/boot/boot.js'
import { createAppRouter } from './router/index.js'
import { setRouter } from './router/holder.js'
import { container } from './app/container/container.js'
import { coreStoreFactories } from './app/stores/index.js'
import { loadProjectConfig } from '../projects/loadProject.js'

async function start() {
  for (const [name, factory] of Object.entries(coreStoreFactories)) {
    container.register(name, factory)
  }

  const projectConfig = await loadProjectConfig()
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
