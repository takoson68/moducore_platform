import { ref, reactive, toRaw } from 'vue'

const DEFAULT_PERSIST_DELAY = 80

function isPlainObject(value) {
  return Object.prototype.toString.call(value) === '[object Object]'
}

function isTypeMatch(value, template) {
  if (Array.isArray(template)) return Array.isArray(value)
  if (isPlainObject(template)) return isPlainObject(value)
  return typeof value === typeof template
}

function cloneValue(value) {
  const rawValue = toRaw(value)

  try {
    return structuredClone(rawValue)
  } catch {
    return sanitizeForPersistence(rawValue)
  }
}

function canUseStorage() {
  if (typeof window === 'undefined' || typeof window.localStorage === 'undefined') {
    return false
  }

  try {
    const probeKey = '__moducore_store_probe__'
    window.localStorage.setItem(probeKey, '1')
    window.localStorage.removeItem(probeKey)
    return true
  } catch {
    return false
  }
}

function normalizePersistKeys(persistKeys, defaultValue) {
  if (!Array.isArray(persistKeys) || persistKeys.length === 0) {
    return null
  }

  if (!isPlainObject(defaultValue)) {
    return null
  }

  return persistKeys.filter((key) => typeof key === 'string' && key in defaultValue)
}

function sanitizeForPersistence(value, seen = new WeakSet()) {
  const rawValue = toRaw(value)

  if (
    rawValue === null ||
    typeof rawValue === 'string' ||
    typeof rawValue === 'number' ||
    typeof rawValue === 'boolean'
  ) {
    return rawValue
  }

  if (typeof rawValue === 'undefined' || typeof rawValue === 'function' || typeof rawValue === 'symbol') {
    return undefined
  }

  if (rawValue instanceof Date) {
    return rawValue.toISOString()
  }

  if (Array.isArray(rawValue)) {
    return rawValue
      .map((item) => sanitizeForPersistence(item, seen))
      .filter((item) => typeof item !== 'undefined')
  }

  if (typeof rawValue !== 'object') {
    return rawValue
  }

  if (typeof window !== 'undefined') {
    if (rawValue === window) return undefined
    if (rawValue instanceof Node) return undefined
  }

  if (seen.has(rawValue)) {
    return undefined
  }

  seen.add(rawValue)

  if (!isPlainObject(rawValue)) {
    return undefined
  }

  const snapshot = {}

  Object.entries(rawValue).forEach(([key, item]) => {
    const sanitized = sanitizeForPersistence(item, seen)
    if (typeof sanitized !== 'undefined') {
      snapshot[key] = sanitized
    }
  })

  seen.delete(rawValue)
  return snapshot
}

function buildPersistPayload(value, persistKeys) {
  const rawValue = toRaw(value)

  if (!persistKeys || !isPlainObject(rawValue)) {
    return sanitizeForPersistence(rawValue)
  }

  return persistKeys.reduce((accumulator, key) => {
    const sanitized = sanitizeForPersistence(rawValue[key])
    if (typeof sanitized !== 'undefined') {
      accumulator[key] = sanitized
    }
    return accumulator
  }, {})
}

export function createStore({
  name,
  storageKey = null,
  persistKeys = null,
  persistDelay = DEFAULT_PERSIST_DELAY,
  defaultValue,
  actions = null,
}) {
  if (!name) throw new Error('[createStore] missing name')
  if (defaultValue === undefined) throw new Error('[createStore] missing defaultValue')

  const isObjectState = isPlainObject(defaultValue)
  const isArrayState = Array.isArray(defaultValue)
  const usesReactiveState = isObjectState || isArrayState
  const storageAvailable = Boolean(storageKey) && canUseStorage()
  const normalizedPersistKeys = normalizePersistKeys(persistKeys, defaultValue)
  const persistWait = Number.isFinite(persistDelay) ? Math.max(50, persistDelay) : DEFAULT_PERSIST_DELAY

  const state = usesReactiveState
    ? reactive(cloneValue(defaultValue))
    : ref(defaultValue)

  let persistTimer = null
  let persistPending = false

  function readStateValue() {
    return usesReactiveState ? state : state.value
  }

  function commitValue(value) {
    if (!isTypeMatch(value, defaultValue)) {
      throw new TypeError(`[${name}] set received invalid value type`)
    }

    if (isObjectState) {
      Object.assign(state, value)
      return
    }

    if (isArrayState) {
      state.splice(0, state.length, ...value)
      return
    }

    state.value = value
  }

  function flushPersist() {
    if (!storageAvailable || !storageKey || !persistPending) {
      persistPending = false
      return
    }

    const payload = buildPersistPayload(readStateValue(), normalizedPersistKeys)
    persistPending = false

    try {
      window.localStorage.setItem(storageKey, JSON.stringify(payload))
    } catch (error) {
      const isQuotaError =
        error?.name === 'QuotaExceededError' ||
        error?.name === 'NS_ERROR_DOM_QUOTA_REACHED' ||
        error?.code === 22 ||
        error?.code === 1014

      if (isQuotaError) {
        console.warn(`[${name}] localStorage quota exceeded`, error)
        return
      }

      console.warn(`[${name}] failed to persist store`, error)
    }
  }

  function schedulePersist() {
    if (!storageAvailable || !storageKey) return

    persistPending = true

    if (persistTimer !== null) {
      clearTimeout(persistTimer)
    }

    persistTimer = window.setTimeout(() => {
      persistTimer = null
      flushPersist()
    }, persistWait)
  }

  const store = {
    state,

    get() {
      return readStateValue()
    },

    set(value) {
      commitValue(value)
      schedulePersist()
    },

    clear() {
      if (persistTimer !== null) {
        clearTimeout(persistTimer)
        persistTimer = null
      }

      commitValue(cloneValue(defaultValue))
      persistPending = false

      if (!storageAvailable || !storageKey) return

      try {
        window.localStorage.removeItem(storageKey)
      } catch (error) {
        console.warn(`[${name}] failed to clear persisted store`, error)
      }
    },

    loadFromStorage() {
      if (!storageAvailable || !storageKey) return

      let raw = null
      try {
        raw = window.localStorage.getItem(storageKey)
      } catch (error) {
        console.warn(`[${name}] failed to read localStorage`, error)
        return
      }

      if (raw === null) return

      let parsed
      try {
        parsed = JSON.parse(raw)
      } catch (error) {
        console.warn(`[${name}] failed to parse persisted store`, error)
        return
      }

      try {
        if (normalizedPersistKeys && isObjectState) {
          commitValue({
            ...cloneValue(defaultValue),
            ...parsed,
          })
          return
        }

        commitValue(parsed)
      } catch (error) {
        console.warn(`[${name}] ignored invalid persisted payload`, error)
      }
    },

    flushPersist,
  }

  if (actions) {
    Object.entries(actions).forEach(([key, fn]) => {
      store[key] = (...args) => fn(store, ...args)
    })
  }

  store.loadFromStorage()
  return store
}
