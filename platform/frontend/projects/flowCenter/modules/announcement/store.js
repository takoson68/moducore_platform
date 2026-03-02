import world from '@/world.js'
import {
  createAnnouncementRecord,
  deleteAnnouncementRecord,
  fetchAnnouncements
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

export function createAnnouncementStore() {
  return world.createStore({
    name: 'flowCenterAnnouncementStore',
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
          const records = await fetchAnnouncements()
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
        if (state.saving || !isManager()) return

        store.set({
          ...state,
          saving: true,
          error: ''
        })

        try {
          await createAnnouncementRecord({
            title: state.form.title,
            content: state.form.content,
            publish_now: state.form.publishNow
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
