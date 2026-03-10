import world from '@/world.js'
import { loadVisitorStatsSnapshot } from './service.js'

export function createVisitorStatsStore() {
  return world.createStore({
    name: 'dineCoreVisitorStatsStore',
    defaultValue: {
      loading: false,
      error: '',
      range: 'today',
      rows: [],
      lastLoadedAt: ''
    },
    actions: {
      async load(store, range = store.get().range || 'today') {
        const safeRange = String(range || 'today').trim() || 'today'

        store.set({
          ...store.get(),
          loading: true,
          error: '',
          range: safeRange
        })

        try {
          const snapshot = await loadVisitorStatsSnapshot(safeRange)
          store.set({
            ...store.get(),
            loading: false,
            error: '',
            range: snapshot.range,
            rows: snapshot.rows,
            lastLoadedAt: new Date().toLocaleString('zh-TW', { hour12: false })
          })
        } catch (error) {
          store.set({
            ...store.get(),
            loading: false,
            error: error instanceof Error ? error.message : 'VISITOR_STATS_LOAD_FAILED'
          })
        }
      },
      setRange(store, range = 'today') {
        store.set({
          ...store.get(),
          range: String(range || 'today').trim() || 'today'
        })
      }
    }
  })
}
