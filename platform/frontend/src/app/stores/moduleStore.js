//- src/app/stores/moduleStore.js
import { createStore } from '@/core'

export function createModuleStore() {
  const store = createStore({
    name: 'moduleStore',
    defaultValue: { modules: [] }
  })

  function setModules(modules) {
    store.set({ modules })
  }

  function clearAll() {
    store.clear()
  }

  return {
    get: store.get,
    set: store.set,
    state: store.state,
    setModules,
    clearAll,
    clear: store.clear
  }
}
