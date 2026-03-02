import world from '@/world.js'
import { createTaskRecord, deleteTaskRecord, fetchTasks } from './service.js'

const priorityLabelMap = {
  high: '高',
  medium: '中',
  low: '低'
}

const statusLabelMap = {
  todo: '待處理',
  doing: '進行中',
  done: '已完成'
}

function isLoggedIn() {
  return Boolean(world.store('auth').state.user)
}

function createDefaultForm() {
  return {
    title: '',
    assigneeUserId: '',
    dueDate: '',
    priority: 'medium',
    status: 'todo',
    description: ''
  }
}

function normalizeRecord(record) {
  return {
    ...record,
    priorityLabel: priorityLabelMap[record.priority] || record.priority,
    statusLabel: statusLabelMap[record.status] || record.status
  }
}

export function createTaskStore() {
  return world.createStore({
    name: 'flowCenterTaskStore',
    defaultValue: {
      loading: false,
      saving: false,
      error: '',
      records: [],
      selectedId: null,
      form: createDefaultForm()
    },
    actions: {
      reset(store) {
        store.set({
          ...store.get(),
          loading: false,
          saving: false,
          error: '',
          records: [],
          selectedId: null,
          form: createDefaultForm()
        })
      },
      selectRecord(store, id) {
        store.set({
          ...store.get(),
          selectedId: id
        })
      },
      updateForm(store, patch = {}) {
        const state = store.get()
        store.set({
          ...state,
          form: {
            ...state.form,
            ...patch
          }
        })
      },
      clearForm(store) {
        store.set({
          ...store.get(),
          form: createDefaultForm()
        })
      },
      async load(store) {
        if (!isLoggedIn()) {
          store.reset()
          return
        }

        store.set({
          ...store.get(),
          loading: true,
          error: ''
        })

        try {
          const records = (await fetchTasks()).map(normalizeRecord)
          store.set({
            ...store.get(),
            loading: false,
            records,
            selectedId: records[0]?.id || null
          })
        } catch (error) {
          store.set({
            ...store.get(),
            loading: false,
            records: [],
            selectedId: null,
            error: error.message
          })
        }
      },
      async create(store) {
        const state = store.get()
        if (state.saving || !isLoggedIn()) return

        store.set({
          ...state,
          saving: true,
          error: ''
        })

        try {
          await createTaskRecord({
            title: state.form.title,
            assignee_user_id: state.form.assigneeUserId ? Number(state.form.assigneeUserId) : null,
            due_date: state.form.dueDate,
            priority: state.form.priority,
            status: state.form.status,
            description: state.form.description
          })
          store.clearForm()
          await store.load()
        } catch (error) {
          store.set({
            ...store.get(),
            saving: false,
            error: error.message
          })
          return
        }

        store.set({
          ...store.get(),
          saving: false
        })
      },
      async removeSelected(store) {
        const state = store.get()
        if (state.saving || !isLoggedIn() || !state.selectedId) return

        store.set({
          ...state,
          saving: true,
          error: ''
        })

        try {
          await deleteTaskRecord(state.selectedId)
          await store.load()
        } catch (error) {
          store.set({
            ...store.get(),
            saving: false,
            error: error.message
          })
          return
        }

        store.set({
          ...store.get(),
          saving: false
        })
      }
    }
  })
}
