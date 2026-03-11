import { computed, reactive, readonly } from 'vue'
import {
  getStaffSession,
  loginStaffSession,
  logoutStaffSession
} from '@project/api/staffSessionApi.js'

const state = reactive({
  session: null,
  initialized: false,
  isSubmitting: false,
  errorMessage: ''
})

let loadPromise = null

function normalizeErrorMessage(error) {
  const code = error instanceof Error ? error.message : String(error || '')

  switch (code) {
    case 'STAFF_LOGIN_FAILED':
      return '員工登入失敗，請確認帳號密碼。'
    default:
      return '員工登入失敗，請稍後再試。'
  }
}

async function loadSession({ force = false } = {}) {
  if (loadPromise && !force) return loadPromise

  loadPromise = (async () => {
    const payload = await getStaffSession()
    state.session = payload.session || null
    state.initialized = true
    state.errorMessage = ''
    return state.session
  })()

  try {
    return await loadPromise
  } finally {
    loadPromise = null
  }
}

async function ensureSessionLoaded() {
  if (state.initialized) return state.session
  return loadSession()
}

async function login(payload = {}) {
  state.isSubmitting = true
  state.errorMessage = ''

  try {
    const result = await loginStaffSession(payload)
    state.session = result.session || null
    state.initialized = true
    return state.session
  } catch (error) {
    state.session = null
    state.initialized = true
    state.errorMessage = normalizeErrorMessage(error)
    throw error
  } finally {
    state.isSubmitting = false
  }
}

async function logout() {
  await logoutStaffSession()
  state.session = null
  state.initialized = true
  state.isSubmitting = false
  state.errorMessage = ''
}

function clearError() {
  state.errorMessage = ''
}

const session = computed(() => state.session || null)
const isAuthenticated = computed(() => Boolean(session.value))
const currentRole = computed(() => String(session.value?.role || ''))
const isSuperAdmin = computed(() => Boolean(session.value?.isSuperAdmin))

export function useDineCoreStaffAuth() {
  return {
    state: readonly(state),
    session,
    isAuthenticated,
    currentRole,
    isSuperAdmin,
    bootstrap: ensureSessionLoaded,
    signIn: login,
    signOut: logout,
    loadSession,
    ensureSessionLoaded,
    login,
    logout,
    clearError
  }
}

export function getDineCoreStaffToken() {
  return String(state.session?.token || '').trim()
}
