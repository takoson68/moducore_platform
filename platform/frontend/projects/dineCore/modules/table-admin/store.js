import world from '@/world.js'
import {
  clearTableAdminGuestSessions,
  generateTableAdminQr,
  importTableAdminTablesFromMap,
  loadTableAdminMapDetail,
  loadTableAdminMaps,
  loadTableAdminTables,
  reimportTableAdminTablesFromMap,
  updateTableAdminTable
} from './service.js'

export function createTableAdminStore() {
  return world.createStore({
    name: 'dineCoreTableAdminStore',
    defaultValue: {
      maps: [],
      selectedMapId: '',
      selectedMap: null,
      tables: [],
      lastImportSummary: null
    },
    actions: {
      async loadMaps(store) {
        const payload = await loadTableAdminMaps()
        const state = store.get()
        const maps = payload.maps || []
        const selectedMapId = maps.some(map => map.id === state.selectedMapId)
          ? state.selectedMapId
          : (maps[0]?.id || '')

        store.set({
          ...state,
          maps,
          selectedMapId
        })

        return selectedMapId
      },
      async selectMap(store, payload = {}) {
        const state = store.get()
        const mapId = String(payload.mapId || payload.map_id || state.selectedMapId || '').trim()
        if (!mapId) {
          store.set({
            ...state,
            selectedMapId: '',
            selectedMap: null,
            tables: []
          })
          return
        }

        const [selectedMap, tablesPayload] = await Promise.all([
          loadTableAdminMapDetail(mapId),
          loadTableAdminTables({ mapId })
        ])

        store.set({
          ...state,
          selectedMapId: mapId,
          selectedMap,
          tables: tablesPayload.tables || []
        })
      },
      async importFromMap(store, payload = {}) {
        const state = store.get()
        const mapId = String(payload.mapId || payload.map_id || state.selectedMapId || '').trim()
        const result = await importTableAdminTablesFromMap({ mapId })
        const tablesPayload = await loadTableAdminTables({ mapId })

        store.set({
          ...store.get(),
          selectedMapId: mapId,
          tables: tablesPayload.tables || [],
          lastImportSummary: result
        })

        return result
      },
      async reimportFromMap(store, payload = {}) {
        const state = store.get()
        const mapId = String(payload.mapId || payload.map_id || state.selectedMapId || '').trim()
        const result = await reimportTableAdminTablesFromMap({ mapId })
        const tablesPayload = await loadTableAdminTables({ mapId })

        store.set({
          ...store.get(),
          selectedMapId: mapId,
          tables: tablesPayload.tables || [],
          lastImportSummary: result
        })

        return result
      },
      async updateTable(store, payload = {}) {
        const updated = await updateTableAdminTable(payload)
        const state = store.get()
        store.set({
          ...state,
          tables: state.tables.map(table => (table.code === updated.table.code ? updated.table : table))
        })
      },
      async generateTableQr(_store, payload = {}) {
        return generateTableAdminQr(payload)
      },
      async clearGuestSessions(_store, payload = {}) {
        return clearTableAdminGuestSessions(payload)
      }
    }
  })
}