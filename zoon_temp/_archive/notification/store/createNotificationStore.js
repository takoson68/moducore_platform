import { createStore } from '@/container/_storeFactory.js'

const normalize = (item) => {
  const now = Date.now()
  return {
    id: item.id || `ntf-${now}-${Math.random().toString(36).slice(2, 6)}`,
    type: item.type || 'system',
    title: item.title || '系統通知',
    content: item.content || '',
    created_at: typeof item.created_at === 'number' ? item.created_at : now,
    read: Boolean(item.read)
  }
}

export function createNotificationStore() {
  return createStore({
    name: 'notificationStore',
    storageKey: 'notificationStore',
    defaultValue: {
      list: [],
      unread: 0
    },
    actions: {
      addNotification(store, item) {
        const state = store.get()
        const notification = normalize(item)
        const nextList = [notification, ...state.list]
        const nextUnread = notification.read ? state.unread : state.unread + 1
        store.set({ ...state, list: nextList, unread: nextUnread })
      },
      markAsRead(store, id) {
        const state = store.get()
        let delta = 0
        const list = state.list.map(n => {
          if (n.id !== id) return n
          if (!n.read) delta += 1
          return { ...n, read: true }
        })
        store.set({ ...state, list, unread: Math.max(0, state.unread - delta) })
      },
      markAllAsRead(store) {
        const state = store.get()
        const list = state.list.map(n => ({ ...n, read: true }))
        store.set({ ...state, list, unread: 0 })
      },
      clear(store) {
        store.set({ list: [], unread: 0 })
      }
    }
  })
}
