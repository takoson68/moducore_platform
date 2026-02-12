//- src/app/stores/platformConfigStore.js
import { createStore } from '@/core'

export function createPlatformConfigStore() {
  const store = createStore({
    name: 'platformConfigStore',
    defaultValue: { config: null }
  })

  function setConfig(config) {
    store.set({ config })
  }

  function reset() {
    store.clear()
  }

  return {
    get: store.get,
    set: store.set,
    state: store.state,
    setConfig,
    reset,
    clear: store.clear
  }
}
