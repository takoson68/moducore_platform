import WelcomePage from './pages/WelcomePage.vue'
import { routes } from './routes.js'

export default {
  name: 'welcome',
  view: WelcomePage,
  setup: {
    routes
  }
}
