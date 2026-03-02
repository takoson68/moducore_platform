import world from '@/world.js'
import { fetchDashboardSummary } from './service.js'

function isLoggedIn() {
  return Boolean(world.store('auth').state.user)
}

export function createDashboardStore() {
  return world.createStore({
    name: 'flowCenterDashboardStore',
    defaultValue: {
      loading: false,
      error: '',
      summary: null
    },
    actions: {
      reset(store) {
        store.set({
          ...store.get(),
          loading: false,
          error: '',
          summary: null
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
          const summary = await fetchDashboardSummary()
          store.set({
            ...store.get(),
            loading: false,
            summary
          })
        } catch (error) {
          store.set({
            ...store.get(),
            loading: false,
            error: error.message,
            summary: null
          })
        }
      }
    }
  })
}
