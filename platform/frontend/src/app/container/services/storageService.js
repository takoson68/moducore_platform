//- src/app/container/services/storageService.js

/**
 * Storage Capability（Local-first / Phase 1）
 * ==================================================
 * 取得方式（唯一）：
 * - `world.services.storage()`
 * - 不得直接 import `storageService` 或底層 driver 作為模組使用入口
 *
 * store 與 storage 的責任分離：
 * - storage 是 I/O capability，只負責本地讀寫
 * - storage 不持有 reactive state
 * - store 才是前端狀態的 Single Source of Truth
 * - 正確流程是「storage 讀取 -> 寫入 store.state」，以及「store.state 更新 -> storage 持久化」
 *
 * Contract（固定 API）：
 * - async get(key)
 * - async set(key, value)
 * - async remove(key)
 * - async list(prefix?)
 * - async batch(ops)
 *
 * namespace key 強制規則：
 * - key 至少兩層 namespace，格式示例：`tasks:list`
 * - 不符合規則時直接 throw
 * - 可使用 `assertNamespacedKey(key)` 驗證
 *
 * 自動降級語意（Auto Fallback）：
 * - 預設 driver 為 IndexedDB（idbDriver）
 * - 若 IDB 初始化或 transaction 失敗，會自動降級至 memoryDriver
 * - 僅 `console.warn` 一次，避免洗版
 * - 降級後 API contract 不變，但不保證 reload 後仍持久存在
 *
 * Phase 1 不做：
 * - 白名單治理
 * - migration / 多 objectStore
 * - debounce queue
 * - hydrate 流程
 * - 假資料機制
 * - token/XSS 規則引擎
 * - lifecycle 管理
 * ==================================================
 */

const IDB_DB_NAME = 'moducore_storage'
const IDB_STORE_NAME = 'kv'
const IDB_DB_VERSION = 1

/**
 * 驗證 key 是否符合強制 namespace 規則（至少兩層）。
 * @param {string} key
 * @returns {string}
 */
export function assertNamespacedKey(key) {
  if (typeof key !== 'string') {
    throw new TypeError('[storage] key 必須為字串')
  }

  const normalized = key.trim()
  const parts = normalized.split(':')
  const isValid = parts.length >= 2 && parts.every((part) => part.trim().length > 0)

  if (!isValid) {
    throw new Error('[storage] key 必須使用 namespace（至少兩層，例如 "tasks:list"）')
  }

  return normalized
}

/**
 * 驗證 value 是否可被 structured clone（例如 circular 需拋錯）。
 * @param {unknown} value
 */
function assertStorableValue(value) {
  if (typeof structuredClone !== 'function') {
    return
  }

  try {
    structuredClone(value)
  } catch (error) {
    throw new Error('[storage] value 無法儲存（structured clone 失敗）', { cause: error })
  }
}

/**
 * 建立記憶體 driver（Map 實作）。
 * @returns {object}
 */
function createMemoryDriver() {
  const store = new Map()

  return {
    kind: 'memory',
    async get(key) {
      return store.has(key) ? store.get(key) : null
    },
    async set(key, value) {
      store.set(key, value)
    },
    async remove(key) {
      store.delete(key)
    },
    async list(prefix = '') {
      const items = []
      for (const [key, value] of store.entries()) {
        if (!prefix || key.startsWith(prefix)) {
          items.push({ key, value })
        }
      }
      return items
    },
    async batch(ops) {
      for (const op of ops) {
        if (op.type === 'set') {
          store.set(op.key, op.value)
          continue
        }
        if (op.type === 'remove') {
          store.delete(op.key)
          continue
        }
        throw new Error(`[storage] 不支援的 batch 操作: ${op.type}`)
      }
    },
  }
}

/**
 * 建立 IndexedDB driver（單一 objectStore）。
 * @returns {object}
 */
function createIdbDriver() {
  let dbPromise = null

  function openDatabase() {
    if (dbPromise) return dbPromise

    dbPromise = new Promise((resolve, reject) => {
      if (typeof indexedDB === 'undefined') {
        reject(new Error('[storage] IndexedDB 不可用'))
        return
      }

      const request = indexedDB.open(IDB_DB_NAME, IDB_DB_VERSION)

      request.onupgradeneeded = () => {
        const db = request.result
        if (!db.objectStoreNames.contains(IDB_STORE_NAME)) {
          db.createObjectStore(IDB_STORE_NAME)
        }
      }

      request.onsuccess = () => {
        const db = request.result

        db.onversionchange = () => {
          db.close()
        }

        resolve(db)
      }

      request.onerror = () => {
        reject(request.error || new Error('[storage] IndexedDB open 失敗'))
      }
    })

    dbPromise.catch(() => {
      dbPromise = null
    })

    return dbPromise
  }

  function requestToPromise(request) {
    return new Promise((resolve, reject) => {
      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(request.error || new Error('[storage] IndexedDB request 失敗'))
    })
  }

  async function withTransaction(mode, run) {
    const db = await openDatabase()

    return new Promise((resolve, reject) => {
      let settled = false
      let tx

      try {
        tx = db.transaction(IDB_STORE_NAME, mode)
      } catch (error) {
        reject(error)
        return
      }

      const store = tx.objectStore(IDB_STORE_NAME)

      tx.oncomplete = () => {
        if (settled) return
        settled = true
        resolve(undefined)
      }

      tx.onerror = () => {
        if (settled) return
        settled = true
        reject(tx.error || new Error('[storage] IndexedDB transaction 失敗'))
      }

      tx.onabort = () => {
        if (settled) return
        settled = true
        reject(tx.error || new Error('[storage] IndexedDB transaction 中止'))
      }

      Promise.resolve()
        .then(() => run(store, tx))
        .then((result) => {
          if (result !== undefined && !settled) {
            settled = true
            resolve(result)
          }
        })
        .catch((error) => {
          try {
            tx.abort()
          } catch {
            // tx 可能已完成或無法中止，忽略即可
          }
          if (settled) return
          settled = true
          reject(error)
        })
    })
  }

  return {
    kind: 'idb',
    async get(key) {
      return withTransaction('readonly', async (store) => {
        const value = await requestToPromise(store.get(key))
        return value === undefined ? null : value
      })
    },
    async set(key, value) {
      await withTransaction('readwrite', async (store) => {
        await requestToPromise(store.put(value, key))
      })
    },
    async remove(key) {
      await withTransaction('readwrite', async (store) => {
        await requestToPromise(store.delete(key))
      })
    },
    async list(prefix = '') {
      return withTransaction('readonly', (store) => {
        return new Promise((resolve, reject) => {
          const items = []
          const request = store.openCursor()

          request.onsuccess = () => {
            const cursor = request.result
            if (!cursor) {
              resolve(items)
              return
            }

            const key = String(cursor.key)
            if (!prefix || key.startsWith(prefix)) {
              items.push({ key, value: cursor.value })
            }
            cursor.continue()
          }

          request.onerror = () => {
            reject(request.error || new Error('[storage] IndexedDB cursor 失敗'))
          }
        })
      })
    },
    async batch(ops) {
      await withTransaction('readwrite', async (store) => {
        for (const op of ops) {
          if (op.type === 'set') {
            await requestToPromise(store.put(op.value, op.key))
            continue
          }
          if (op.type === 'remove') {
            await requestToPromise(store.delete(op.key))
            continue
          }
          throw new Error(`[storage] 不支援的 batch 操作: ${op.type}`)
        }
      })
    },
  }
}

/**
 * 正規化並驗證 batch 操作列表。
 * @param {unknown} ops
 * @returns {Array<{ type: 'set' | 'remove', key: string, value?: unknown }>}
 */
function normalizeBatchOps(ops) {
  if (!Array.isArray(ops)) {
    throw new TypeError('[storage] batch(ops) 需要陣列參數')
  }

  return ops.map((op, index) => {
    if (!op || typeof op !== 'object') {
      throw new TypeError(`[storage] batch ops[${index}] 必須為物件`)
    }

    const type = op.type
    if (type !== 'set' && type !== 'remove') {
      throw new Error(`[storage] batch ops[${index}] type 必須為 "set" 或 "remove"`)
    }

    const key = assertNamespacedKey(op.key)

    if (type === 'set') {
      assertStorableValue(op.value)
      return { type, key, value: op.value }
    }

    return { type, key }
  })
}

/**
 * 建立 storage capability。
 * @param {{ driver?: object }} [options]
 * @returns {{
 *   get: (key: string) => Promise<unknown>,
 *   set: (key: string, value: unknown) => Promise<void>,
 *   remove: (key: string) => Promise<void>,
 *   list: (prefix?: string) => Promise<Array<{ key: string, value: unknown }>>,
 *   batch: (ops: Array<{ type: 'set' | 'remove', key: string, value?: unknown }>) => Promise<void>
 * }}
 */
export function createStorageService({ driver } = {}) {
  const memoryDriver = createMemoryDriver()
  let activeDriver = driver ?? createIdbDriver()
  let didWarnFallback = false

  function warnFallbackOnce(error) {
    if (didWarnFallback) return
    didWarnFallback = true
    console.warn('[storage] IndexedDB 不可用，已降級至 memoryDriver（reload 後不保證保留資料）', error)
  }

  function isIdbDriver(candidate) {
    return candidate?.kind === 'idb'
  }

  async function runWithFallback(task) {
    try {
      return await task(activeDriver)
    } catch (error) {
      if (!isIdbDriver(activeDriver)) {
        throw error
      }
      activeDriver = memoryDriver
      warnFallbackOnce(error)
      return task(activeDriver)
    }
  }

  return {
    async get(key) {
      const safeKey = assertNamespacedKey(key)
      return runWithFallback((runtimeDriver) => runtimeDriver.get(safeKey))
    },
    async set(key, value) {
      const safeKey = assertNamespacedKey(key)
      assertStorableValue(value)
      await runWithFallback((runtimeDriver) => runtimeDriver.set(safeKey, value))
    },
    async remove(key) {
      const safeKey = assertNamespacedKey(key)
      await runWithFallback((runtimeDriver) => runtimeDriver.remove(safeKey))
    },
    async list(prefix) {
      const normalizedPrefix = prefix == null ? '' : assertNamespacedKey(prefix)
      return runWithFallback((runtimeDriver) => runtimeDriver.list(normalizedPrefix))
    },
    async batch(ops) {
      const normalizedOps = normalizeBatchOps(ops)
      await runWithFallback((runtimeDriver) => runtimeDriver.batch(normalizedOps))
    },
  }
}

