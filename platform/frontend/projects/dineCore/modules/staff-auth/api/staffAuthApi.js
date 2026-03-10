import world from '@/world.js'
import { mockApiRequest } from '@project/api/mockRequest.js'

function mapSessionUser(user, token = '') {
  if (!user) return { session: null, token: token || '' }

  return {
    session: {
      id: user.id,
      account: user.username || '',
      name: user.name || user.username || '',
      role: user.role || '',
      isSuperAdmin: Boolean(user.isSuperAdmin ?? user.is_super_admin ?? false),
      token: token || ''
    },
    token: token || ''
  }
}

export async function getStaffSession() {
  if (world.apiMode() !== 'real') {
    return mockApiRequest('staff-auth/session')
  }

  const result = await world.authApi().session()
  if (!result.ok || result.data?.authenticated !== true || !result.data?.user) {
    return { session: null }
  }

  return mapSessionUser(result.data.user, result.data.token)
}

export async function loginStaffSession(payload = {}) {
  if (world.apiMode() !== 'real') {
    return mockApiRequest('staff-auth/login', payload)
  }

  const result = await world.authApi().login({
    username: payload.account || '',
    password: payload.password || ''
  })

  if (!result.ok || result.data?.success === false || !result.data?.user) {
    throw new Error('STAFF_LOGIN_FAILED')
  }

  return mapSessionUser(result.data.user, result.data.token)
}

export async function logoutStaffSession() {
  if (world.apiMode() !== 'real') {
    return mockApiRequest('staff-auth/logout')
  }

  await world.authApi().logout()
  return { success: true }
}
