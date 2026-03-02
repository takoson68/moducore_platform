import { computed, reactive, readonly } from 'vue'
import world from '@/world.js'
import { flowCenterApi } from './flowCenterApi.js'

const state = reactive({
  ready: false,
  loading: false,
  loggingIn: false,
  error: '',
  context: null
})

function authStore() {
  return world.store('auth')
}

function tokenStore() {
  return world.store('token')
}

function normalizeContext(data) {
  if (!data?.authenticated || !data?.context) {
    return null
  }

  return {
    userId: data.context.user_id,
    role: data.context.role,
    companyId: data.context.company_id,
    username: data.context.username,
    displayName: data.context.display_name,
    token: data.context.token
  }
}

function syncAuthStore(context) {
  const store = authStore()
  if (!context) {
    store.logout()
    return
  }

  store.login({
    id: context.userId,
    username: context.username,
    name: context.displayName || context.username,
    role: context.role,
    company_id: context.companyId
  })
}

export async function restoreFlowCenterSession() {
  state.loading = true
  state.error = ''

  try {
    await world.authApi().restoreSession()
    const result = await flowCenterApi.get('/api/flowcenter/session')
    state.context = result.ok ? normalizeContext(result.data) : null
    syncAuthStore(state.context)
    state.ready = true
    if (!result.ok && result.status !== 401) {
      state.error = result.data?.error?.message || '無法還原登入狀態'
    }
    return result
  } finally {
    state.loading = false
  }
}

export async function loginFlowCenter(payload) {
  state.loggingIn = true
  state.error = ''

  try {
    const loginResult = await world.authApi().login(payload)
    if (!loginResult.ok || loginResult.data?.success === false) {
      state.error = loginResult.data?.message || '登入失敗'
      state.context = null
      syncAuthStore(null)
      return loginResult
    }

    const sessionResult = await flowCenterApi.get('/api/flowcenter/session')
    state.context = sessionResult.ok ? normalizeContext(sessionResult.data) : null
    syncAuthStore(state.context)
    state.ready = true

    if (!sessionResult.ok) {
      state.error = sessionResult.data?.error?.message || '登入成功，但無法取得身份內容'
    }

    return sessionResult
  } finally {
    state.loggingIn = false
  }
}

export async function logoutFlowCenter() {
  state.loading = true
  state.error = ''

  try {
    await world.authApi().logout()
    tokenStore().setToken(null)
    state.context = null
    state.ready = true
    syncAuthStore(null)
  } finally {
    state.loading = false
  }
}

export function useFlowCenterAuth() {
  return {
    state: readonly(state),
    user: computed(() => authStore().state.user),
    isLoggedIn: computed(() => Boolean(state.context)),
    role: computed(() => state.context?.role || ''),
    companyId: computed(() => state.context?.companyId || ''),
    displayName: computed(() => state.context?.displayName || ''),
    restoreSession: restoreFlowCenterSession,
    login: loginFlowCenter,
    logout: logoutFlowCenter
  }
}
