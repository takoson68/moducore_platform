//- projects/modudesk/services/identityRepo.js
import world from '@/world.js'

const IDENTITY_KEY = 'modudesk:identity'

function getStorage() {
  return world.services.storage()
}

function normalizeIdentity(raw) {
  if (!raw || typeof raw !== 'object') return null
  const displayName = typeof raw.displayName === 'string' ? raw.displayName.trim() : ''
  if (!displayName) return null

  return {
    displayName,
    loggedInAt: typeof raw.loggedInAt === 'string' ? raw.loggedInAt : new Date().toISOString()
  }
}

export async function getIdentity() {
  try {
    const value = await getStorage().get(IDENTITY_KEY)
    return normalizeIdentity(value)
  } catch (error) {
    throw new Error('讀取登入資訊失敗', { cause: error })
  }
}

export async function login({ displayName }) {
  const normalizedName = typeof displayName === 'string' ? displayName.trim() : ''
  if (!normalizedName) {
    throw new Error('請輸入顯示名稱')
  }

  const nextIdentity = {
    displayName: normalizedName,
    loggedInAt: new Date().toISOString()
  }

  try {
    await getStorage().set(IDENTITY_KEY, nextIdentity)
    return nextIdentity
  } catch (error) {
    throw new Error('儲存登入資訊失敗', { cause: error })
  }
}

export async function logout() {
  try {
    await getStorage().remove(IDENTITY_KEY)
  } catch (error) {
    throw new Error('清除登入資訊失敗', { cause: error })
  }
}

