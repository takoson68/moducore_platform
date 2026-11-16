import { createChatBackupStore } from './store.js'

export default {
  name: 'chat-backup',
  setup: {
    stores: { chatCoreBackup: createChatBackupStore }
  }
}
