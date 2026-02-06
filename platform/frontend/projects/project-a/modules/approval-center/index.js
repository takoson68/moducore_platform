//- projects/project-a/modules/approval-center/index.js
import ApprovalCenterPage from './pages/ApprovalCenterPage.vue'
import { routes } from './routes.js'

export default {
  name: 'approval-center',
  view: ApprovalCenterPage,
  setup: {
    routes
  }
}
