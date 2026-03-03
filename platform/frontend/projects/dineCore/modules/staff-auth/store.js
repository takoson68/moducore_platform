import world from '@/world.js'
import { loadStaffSession, loginStaff, logoutStaff } from './service.js'

export function createStaffAuthStore() {
  return world.createStore({
    name: 'dineCoreStaffAuthStore',
    defaultValue: {
      session: null,
      initialized: false,
      isSubmitting: false,
      errorMessage: ''
    },
    actions: {
      async loadSession(store) {
        const payload = await loadStaffSession()
        store.set({
          ...store.get(),
          session: payload.session || null,
          initialized: true,
          errorMessage: ''
        })
      },
      async login(store, payload = {}) {
        store.set({
          ...store.get(),
          isSubmitting: true,
          errorMessage: ''
        })

        try {
          const result = await loginStaff(payload)
          store.set({
            ...store.get(),
            session: result.session || null,
            initialized: true,
            isSubmitting: false,
            errorMessage: ''
          })
        } catch (error) {
          store.set({
            ...store.get(),
            session: null,
            initialized: true,
            isSubmitting: false,
            errorMessage: '登入失敗，請確認帳號與密碼。'
          })
        }
      },
      async logout(store) {
        await logoutStaff()
        store.set({
          ...store.get(),
          session: null,
          initialized: true,
          isSubmitting: false,
          errorMessage: ''
        })
      },
      clearError(store) {
        store.set({
          ...store.get(),
          errorMessage: ''
        })
      }
    }
  })
}
