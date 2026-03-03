const STORAGE_PREFIX = 'dinecore-guest-ordering-session:'

function buildStorageKey(tableCode) {
  return `${STORAGE_PREFIX}${String(tableCode || '').trim().toUpperCase()}`
}

export function getGuestOrderingSessionToken(tableCode) {
  if (typeof window === 'undefined' || !tableCode) {
    return ''
  }

  try {
    return String(window.sessionStorage.getItem(buildStorageKey(tableCode)) || '')
  } catch {
    return ''
  }
}

export function setGuestOrderingSessionToken(tableCode, token) {
  if (typeof window === 'undefined' || !tableCode) {
    return
  }

  try {
    const storageKey = buildStorageKey(tableCode)
    if (!token) {
      window.sessionStorage.removeItem(storageKey)
      return
    }

    window.sessionStorage.setItem(storageKey, String(token))
  } catch {
    // ignore sessionStorage failures in mock mode
  }
}
