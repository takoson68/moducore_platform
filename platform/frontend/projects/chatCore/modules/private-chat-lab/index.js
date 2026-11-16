import { routes } from './routes.js'
import { createPrivateChatLabStore } from './store.js'

export default {
  name: 'private-chat-lab',
  setup: {
    stores: {
      chatCorePrivateChatLabStore: createPrivateChatLabStore
    },
    routes
  }
}
