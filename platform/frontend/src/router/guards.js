//- src/router/guards.js
// beforeEach：登入、權限、模組啟用判斷
import world from '@/world.js'

export function setupAuthGuard(router) {

  router.beforeEach((to) => {

    const meta = to.meta || {}
    const access = meta.access || {}
    const publicFlag = typeof access.public === 'boolean' ? access.public : meta.public
    const authFlag = typeof access.auth === 'boolean' ? access.auth : meta.auth
    const hasFlags = typeof publicFlag === 'boolean' && typeof authFlag === 'boolean'

    // 非模組路由或未標示權限旗標，直接通過
    if (!hasFlags) {
      return true
    }

    const isPublic = publicFlag === true && authFlag === true
    const isAuthOnly = publicFlag === false && authFlag === true
    const isDisabled = publicFlag === false && authFlag === false

    if (isPublic) {
      return true
    }

    if (isDisabled) {
      return { path: '/404' }
    }

    // auth-only 路由
    let authStore = null
    try {
      authStore = world.store("auth")
    } catch (err) {
      console.warn('[RouterGuard] auth store not available')
      return { path: '/' }
    }

    // ⭐ 平台唯一登入判斷點
    const isLoggedIn = authStore.isLoggedIn()

    if (!isLoggedIn) {
      console.warn('[RouterGuard] 未登入，導向 /')

      return {
        path: '/',
      }
    }

    return true
  })
}
