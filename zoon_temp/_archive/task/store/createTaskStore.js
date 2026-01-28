import { createStore } from '@/container/_storeFactory.js'
import { mockTasks } from '../api/mockTasks.js'

export function createTaskStore() {
  return createStore({
    name: 'taskStore',
    storageKey: 'taskStore',
    defaultValue: {
      tasks: mockTasks,
      activeTaskId: mockTasks[0].id
    },
    actions: {
      selectTask(store, id) {
        const state = store.get()
        store.set({ ...state, activeTaskId: id })
      },
      addMessage(store, { taskId, user, text }) {
        if (!text?.trim()) return
        const state = store.get()
        const now = new Date()
        const stamp = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`
        const tasks = state.tasks.map(t => {
          if (t.id !== taskId) return t
          return {
            ...t,
            messages: [...(t.messages || []), { user, text: text.trim(), created_at: stamp }]
          }
        })
        store.set({ ...state, tasks })
      },
      updateTask(store, id, payload) {
        const state = store.get()
        const tasks = state.tasks.map(t => (t.id === id ? { ...t, ...payload } : t))
        store.set({ ...state, tasks })
      },
      addTask(store, payload) {
        const state = store.get()
        const nextId = state.tasks.reduce((max, t) => Math.max(max, t.id), 0) + 1
        const task = {
          id: nextId,
          title: payload.title?.trim() || '新任務',
          desc: payload.desc?.trim() || '',
          status: payload.status || 'todo',
          priority: payload.priority || 'medium',
          due_date: payload.due_date || '',
          members: payload.members || [],
          messages: payload.messages || []
        }
        store.set({ ...state, tasks: [task, ...state.tasks], activeTaskId: task.id })
      }
    }
  })
}
