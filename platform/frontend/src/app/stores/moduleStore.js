//- src/app/stores/moduleStore.js
import { createStore } from './_storeFactory.js'

export function createModuleStore() {
  const store = createStore({
    name: 'moduleStore',
    defaultValue: { modules: [] }
  })

  function setModules(modules) {
    store.set({ modules })
  }

  return {
    get: store.get,
    set: store.set,
    state: store.state,
    setModules,
    clear: store.clear
  }
}
