//- src/app/stores/platformConfigStore.js
import { createStore } from './_storeFactory.js'

export function createPlatformConfigStore() {
  const store = createStore({
    name: 'platformConfigStore',
    defaultValue: { config: null }
  })

  function setConfig(config) {
    store.set({ config })
  }

  return {
    get: store.get,
    set: store.set,
    state: store.state,
    setConfig,
    clear: store.clear
  }
}
