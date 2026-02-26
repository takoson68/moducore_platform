//- projects/modudesk/composables/useIdentity.js
import { computed, reactive, readonly } from 'vue'
import {
  getIdentity as repoGetIdentity,
  login as repoLogin,
  logout as repoLogout
} from '@project/services/identityRepo.js'

const state = reactive({
  identity: null,
  loading: false,
  error: '',
  hydrated: false
})

let hydratePromise = null

function setError(error) {
  state.error = error instanceof Error ? error.message : String(error || '')
}

async function ensureHydrated() {
  if (state.hydrated) return state.identity
  if (hydratePromise) return hydratePromise

  state.loading = true
  state.error = ''
  hydratePromise = (async () => {
    try {
      state.identity = await repoGetIdentity()
      state.hydrated = true
      return state.identity
    } catch (error) {
      setError(error)
      state.identity = null
      state.hydrated = true
      return null
    } finally {
      state.loading = false
      hydratePromise = null
    }
  })()

  return hydratePromise
}

async function login(payload) {
  state.loading = true
  state.error = ''
  try {
    const nextIdentity = await repoLogin(payload)
    state.identity = nextIdentity
    state.hydrated = true
    return nextIdentity
  } catch (error) {
    setError(error)
    throw error
  } finally {
    state.loading = false
  }
}

async function logout() {
  state.loading = true
  state.error = ''
  try {
    await repoLogout()
    state.identity = null
    state.hydrated = true
  } catch (error) {
    setError(error)
    throw error
  } finally {
    state.loading = false
  }
}

export function useIdentity() {
  return {
    state: readonly(state),
    identity: computed(() => state.identity),
    isLoggedIn: computed(() => Boolean(state.identity)),
    loading: computed(() => state.loading),
    error: computed(() => state.error),
    ensureHydrated,
    login,
    logout
  }
}

