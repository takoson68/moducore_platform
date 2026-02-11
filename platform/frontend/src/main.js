//- src/main.js
import { createApp } from 'vue'
import App from './App.vue'
import world from './world'
import '@project/styles/sass/main.sass'

async function start() {
  await world.start()

  createApp(App, {
    ...world.appProps(),
    projectConfig: world.projectConfig()
  })
    .use(world.router())
    .mount('#app')
}

start()
