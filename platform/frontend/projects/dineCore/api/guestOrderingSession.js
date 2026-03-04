const STORAGE_PREFIX = 'dinecore-guest-ordering-session:'

function buildStorageKey(tableCode) {
  return `${STORAGE_PREFIX}${String(tableCode || '').trim().toUpperCase()}`
}

export function getGuestOrderingSessionToken(tableCode) {
  if (typeof window === 'undefined' || !tableCode) {
    return ''
  }

  try {
    return String(window.localStorage.getItem(buildStorageKey(tableCode)) || '')
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
      window.localStorage.removeItem(storageKey)
      return
    }

    window.localStorage.setItem(storageKey, String(token))
  } catch {
    // ignore browser storage failures in mock mode
  }
}
