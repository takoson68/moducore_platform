//- src/app/stores/authStore.js
import { createStore } from '@/core'

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

  function getUserContext() {
    const currentUser = store.get().user
    return {
      user: currentUser,
      isAuthenticated: Boolean(currentUser)
    }
  }

  function resetUserContext() {
    logout()
  }

  return {
    get: store.get,
    set: store.set,
    state: store.state,
    isLoggedIn,
    login,
    logout,
    getUserContext,
    resetUserContext,
    clear: store.clear,
    loadFromStorage: store.loadFromStorage
  }
}
