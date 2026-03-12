import { computed, reactive, readonly } from 'vue'
import {
  getStaffSession,
  loginStaffSession,
  logoutStaffSession
} from '@project/api/staffSessionApi.js'

const AUTH_STATUS = {
  checking: 'checking',
  guest: 'guest',
  auth: 'auth'
}

const state = reactive({
  session: null,
  initialized: false,
  isBootstrapping: false,
  isSubmitting: false,
  errorMessage: ''
})

let loadPromise = null

function normalizeLoginErrorMessage(error) {
  const code = error instanceof Error ? error.message : String(error || '')

  switch (code) {
    case 'STAFF_LOGIN_FAILED':
      return '員工登入失敗，請確認帳號密碼。'
    default:
      return '員工登入失敗，請稍後再試。'
  }
}

function normalizeBootstrapErrorMessage(error) {
  const code = error instanceof Error ? error.message : String(error || '')

  if (!code) {
    return '員工登入狀態確認失敗，已改以未登入狀態處理。'
  }

  return '員工登入狀態確認失敗，已改以未登入狀態處理。'
}

function normalizeLogoutErrorMessage(error) {
  const code = error instanceof Error ? error.message : String(error || '')

  if (!code) {
    return '員工登出失敗，請稍後再試。'
  }

  return '員工登出失敗，請稍後再試。'
}

async function loadSession({ force = false } = {}) {
  if (loadPromise && !force) return loadPromise

  loadPromise = (async () => {
    state.isBootstrapping = true
    state.errorMessage = ''

    try {
      const payload = await getStaffSession()
      state.session = payload.session || null
      state.initialized = true
      return state.session
    } catch (error) {
      state.session = null
      state.initialized = true
      state.errorMessage = normalizeBootstrapErrorMessage(error)
      return null
    } finally {
      state.isBootstrapping = false
    }
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
    state.errorMessage = ''
    return state.session
  } catch (error) {
    state.session = null
    state.initialized = true
    state.errorMessage = normalizeLoginErrorMessage(error)
    throw error
  } finally {
    state.isSubmitting = false
  }
}

async function logout() {
  try {
    await logoutStaffSession()
    state.session = null
    state.initialized = true
    state.errorMessage = ''
    return true
  } catch (error) {
    state.errorMessage = normalizeLogoutErrorMessage(error)
    throw error
  } finally {
    state.isSubmitting = false
  }
}

function clearError() {
  state.errorMessage = ''
}

const session = computed(() => state.session || null)
const status = computed(() => {
  if (!state.initialized || state.isBootstrapping) return AUTH_STATUS.checking
  if (session.value) return AUTH_STATUS.auth
  return AUTH_STATUS.guest
})
const isChecking = computed(() => status.value === AUTH_STATUS.checking)
const isGuest = computed(() => status.value === AUTH_STATUS.guest)
const isAuthenticated = computed(() => Boolean(session.value))
const currentRole = computed(() => String(session.value?.role || ''))
const isSuperAdmin = computed(() => Boolean(session.value?.isSuperAdmin))

export function useDineCoreStaffAuth() {
  return {
    state: readonly(state),
    status,
    session,
    isChecking,
    isGuest,
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
