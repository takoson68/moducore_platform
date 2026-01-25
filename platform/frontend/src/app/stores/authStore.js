//- src/app/stores/authStore.js
import { createStore } from './_storeFactory.js'

export function createAuthStore() {
  const store = createStore({
    name: 'authStore',
    storageKey: 'auth',
    defaultValue: { user: null }
  })

  function isLoggedIn() {
    return Boolean(store.get().user)
  }

  function login(user) {
    store.set({ user })
  }

  function logout() {
    store.set({ user: null })
  }

  return {
    get: store.get,
    set: store.set,
    state: store.state,
    isLoggedIn,
    login,
    logout,
    clear: store.clear,
    loadFromStorage: store.loadFromStorage
  }
}
