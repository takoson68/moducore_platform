import { computed, reactive, readonly } from 'vue'
import world from '@/world.js'

const state = reactive({
  ready: false,
  loading: false,
  loggingIn: false,
  error: ''
})

function authStore() {
  return world.store('auth')
}

export async function restoreFlowCenterSession() {
  state.loading = true
  state.error = ''

  try {
    const result = await world.authApi().restoreSession()
    if (!result.ok) {
      state.error = result.data?.message || 'Session 取得失敗'
    }
    state.ready = true
    return result
  } finally {
    state.loading = false
  }
}

export async function loginFlowCenter(payload) {
  state.loggingIn = true
  state.error = ''

  try {
    const result = await world.authApi().login(payload)
    if (!result.ok || result.data?.success === false) {
      state.error = result.data?.message || '登入失敗'
    } else {
      state.ready = true
    }
    return result
  } finally {
    state.loggingIn = false
  }
}

export async function logoutFlowCenter() {
  state.loading = true
  state.error = ''

  try {
    const result = await world.authApi().logout()
    state.ready = true
    return result
  } finally {
    state.loading = false
  }
}

export function useFlowCenterAuth() {
  const user = computed(() => authStore().state.user)

  return {
    state: readonly(state),
    user,
    isLoggedIn: computed(() => authStore().isLoggedIn()),
    role: computed(() => user.value?.role || ''),
    companyId: computed(() => user.value?.company_id || ''),
    displayName: computed(() => user.value?.name || user.value?.username || ''),
    restoreSession: restoreFlowCenterSession,
    login: loginFlowCenter,
    logout: logoutFlowCenter
  }
}
