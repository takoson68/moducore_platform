import world from '@/world.js'
import {
  createTableAdminTable,
  clearTableAdminGuestSessions,
  deleteTableAdminTable,
  generateTableAdminQr,
  loadTableAdminTables,
  reorderTableAdminTables,
  updateTableAdminTable
} from './service.js'

export function createTableAdminStore() {
  return world.createStore({
    name: 'dineCoreTableAdminStore',
    defaultValue: {
      tables: []
    },
    actions: {
      async load(store) {
        const payload = await loadTableAdminTables()
        store.set({
          ...store.get(),
          tables: payload.tables || []
        })
      },
      async createTable(store, payload = {}) {
        const nextState = await createTableAdminTable(payload)
        store.set({
          ...store.get(),
          tables: nextState.tables || []
        })
      },
      async updateTable(store, payload = {}) {
        const updated = await updateTableAdminTable(payload)
        const state = store.get()
        store.set({
          ...state,
          tables: state.tables.map(table => (table.code === updated.table.code ? updated.table : table))
        })
      },
      async deleteTable(store, payload = {}) {
        const nextState = await deleteTableAdminTable(payload)
        store.set({
          ...store.get(),
          tables: nextState.tables || []
        })
      },
      async reorderTables(store, payload = {}) {
        const nextState = await reorderTableAdminTables(payload)
        store.set({
          ...store.get(),
          tables: nextState.tables || []
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
