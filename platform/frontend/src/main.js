//- src/main.js
import { createApp } from 'vue'
import App from './App.vue'
import world from './world'
import 'project-main-style-entry'

async function start() {
  await world.start()
  const projectConfig = world.projectConfig()

  if (typeof document !== 'undefined') {
    document.title = projectConfig?.title || 'ModuCore Platform'
    document.documentElement.lang = 'zh-Hant'
  }

  createApp(App, {
    ...world.appProps(),
    projectConfig
  })
    .use(world.router())
    .mount('#app')
}

start()
