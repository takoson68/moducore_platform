import world from '@/world.js'
import {
  createAnnouncementRecord,
  deleteAnnouncementRecord,
  fetchAnnouncements,
  updateAnnouncementRecord
} from './service.js'

function isLoggedIn() {
  return Boolean(world.store('auth').state.user)
}

function isManager() {
  return world.store('auth').state.user?.role === 'manager'
}

function createDefaultForm() {
  return {
    title: '',
    content: '',
    publishNow: true
  }
}

function createFormFromRecord(record) {
  return {
    title: record?.title || '',
    content: record?.content || '',
    publishNow: Boolean(record?.published_at)
  }
}

export function createAnnouncementStore() {
  return world.createStore({
    name: 'flowCenterAnnouncementStore',
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
          const records = await fetchAnnouncements()
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
        if (state.saving || !isManager()) return

        store.set({
          ...state,
          saving: true,
          error: ''
        })

        try {
          const payload = {
            title: state.form.title,
            content: state.form.content,
            publish_now: state.form.publishNow
          }

          if (state.editingId) {
            await updateAnnouncementRecord(state.editingId, payload)
          } else {
            await createAnnouncementRecord(payload)
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
        if (state.saving || !isManager() || !state.selectedId) return

        store.set({
          ...state,
          saving: true,
          error: ''
        })

        try {
          await deleteAnnouncementRecord(state.selectedId)
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
