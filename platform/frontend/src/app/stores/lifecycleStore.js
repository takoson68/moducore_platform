import { createStore } from './_storeFactory.js'

export function createLifecycleStore() {
  const store = createStore({
    name: 'lifecycleStore',
    defaultValue: { phase: 'booting' }
  })

  function setPhase(phase) {
    store.set({ phase })
  }

  return {
    get: store.get,
    set: store.set,
    state: store.state,
    setPhase,
    clear: store.clear
  }
}
