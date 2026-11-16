import world from '@/world.js'
import { downloadBackup, listBackups, uploadBackup } from './api/uploadBackup.js'

export function createChatBackupStore() {
  return world.createStore({
    name: 'chatCoreBackup',
    defaultValue: { busy: false, status: '', error: '', backups: null },
    actions: {
      async requestUpload(store) {
        if (store.get().busy) return
        const token = world.store('token').getToken()
        const username = world.store('auth').state.user?.username
        if (!token || !username || !world.hasStore('chatCorePrivateChatLabStore')) return
        const confirmed = window.confirm(
          `將此瀏覽器所有 chatCore 房間的訊息與待送訊息，以 ${username} 名義上傳到共用備份？所有 chatCore 實驗會員都能下載這份明文備份。`
        )
        if (!confirmed) return

        store.set({ ...store.get(), busy: true, status: '', error: '', backups: null })
        try {
          const snapshot = await world.store('chatCorePrivateChatLabStore').exportSnapshot()
          if (!snapshot.messages.length && !snapshot.outbox.length) throw new Error('這個瀏覽器目前沒有聊天紀錄可備份。')
          await uploadBackup(snapshot, token)
          store.set({ ...store.get(), busy: false, status: '聊天備份已上傳。' })
        } catch (cause) {
          store.set({ ...store.get(), busy: false, error: cause.message })
        }
      },
      async requestList(store) {
        if (store.get().busy) return
        const tokenStore = world.store('token')
        const token = tokenStore.getToken()
        if (!token) return
        store.set({ ...store.get(), busy: true, status: '', error: '', backups: null })
        try {
          const backups = await listBackups(token)
          if (tokenStore.getToken() === token) store.set({ ...store.get(), backups })
        } catch (cause) {
          store.set({ ...store.get(), error: cause.message })
        } finally {
          store.set({ ...store.get(), busy: false })
        }
      },
      closeList(store) {
        store.set({ ...store.get(), backups: null })
      },
      async requestRestore(store, backup, beforeRestore) {
        if (store.get().busy || !world.hasStore('chatCorePrivateChatLabStore')) return
        const tokenStore = world.store('token')
        const token = tokenStore.getToken()
        if (!token) return
        if (!window.confirm('還原會完整覆蓋此瀏覽器所有 chatCore 房間的訊息與待送訊息。請先關閉其他使用同一網址的聊天分頁。確定還原？')) return
        store.set({ ...store.get(), busy: true, status: '', error: '' })
        try {
          const snapshot = await downloadBackup(backup.id, token)
          if (tokenStore.getToken() !== token) throw new Error('登入狀態已變更，請重新選擇備份。')
          beforeRestore?.()
          await world.store('chatCorePrivateChatLabStore').restoreSnapshot(snapshot)
          window.alert('聊天備份已還原。重新進入聊天室即可查看。')
          window.location.reload()
        } catch (cause) {
          store.set({ ...store.get(), busy: false, error: cause.message })
        }
      }
    }
  })
}
