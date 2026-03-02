import world from '@/world.js'
import { createTaskRecord, deleteTaskRecord, fetchTasks, updateTaskRecord } from './service.js'

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

function createFormFromRecord(record) {
  return {
    title: record?.title || '',
    assigneeUserId: record?.assignee_user_id ? String(record.assignee_user_id) : '',
    dueDate: record?.due_date || '',
    priority: record?.priority || 'medium',
    status: record?.status || 'todo',
    description: record?.description || ''
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
      editingId: null,
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
          editingId: null,
          form: createDefaultForm()
        })
      },
      selectRecord(store, id) {
        const state = store.get()
        const record = state.records.find((item) => item.id === id) || null
        store.set({
          ...state,
          selectedId: id,
          editingId: record?.id || null,
          form: record ? createFormFromRecord(record) : state.form
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
        const state = store.get()
        store.set({
          ...state,
          editingId: null,
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
            selectedId: records[0]?.id || null,
            editingId: null
          })
        } catch (error) {
          store.set({
            ...store.get(),
            loading: false,
            records: [],
            selectedId: null,
            editingId: null,
            error: error.message
          })
        }
      },
      async submit(store) {
        const state = store.get()
        if (state.saving || !isLoggedIn()) return

        store.set({
          ...state,
          saving: true,
          error: ''
        })

        try {
          const payload = {
            title: state.form.title,
            assignee_user_id: state.form.assigneeUserId ? Number(state.form.assigneeUserId) : null,
            due_date: state.form.dueDate,
            priority: state.form.priority,
            status: state.form.status,
            description: state.form.description
          }

          if (state.editingId) {
            await updateTaskRecord(state.editingId, payload)
          } else {
            await createTaskRecord(payload)
          }
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
