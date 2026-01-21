import { createStore } from './_storeFactory.js'

export function createTokenStore() {
  const store = createStore({
    name: 'tokenStore',
    storageKey: 'token',
    defaultValue: { token: null }
  })

  function getToken() {
    return store.get().token
  }

  function setToken(token) {
    store.set({ token })
  }

  return {
    get: store.get,
    set: store.set,
    state: store.state,
    getToken,
    setToken,
    clear: store.clear,
    loadFromStorage: store.loadFromStorage
  }
}
