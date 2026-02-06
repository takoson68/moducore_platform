//- projects/project-a/modules/knowledge-base/index.js
import KnowledgeBasePage from './pages/KnowledgeBasePage.vue'
import { routes } from './routes.js'

export default {
  name: 'knowledge-base',
  view: KnowledgeBasePage,
  setup: {
    routes
  }
}
