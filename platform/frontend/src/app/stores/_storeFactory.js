//- src/app/stores/_storeFactory.js
// store 建立工廠函式
import { ref, reactive } from 'vue'

function isPlainObject(val) {
  return Object.prototype.toString.call(val) === '[object Object]'
}

function isTypeMatch(value, template) {
  if (Array.isArray(template)) return Array.isArray(value)
  if (isPlainObject(template)) return isPlainObject(value)
  return typeof value === typeof template
}

export function createStore({
  name,
  storageKey = null,
  defaultValue,
  actions = null,
}) {
  if (!name) throw new Error(`❌ createStore 缺少 name`)
  if (defaultValue === undefined) throw new Error(`❌ createStore 缺少 defaultValue`)

  const isObj = isPlainObject(defaultValue)
  const isArray = Array.isArray(defaultValue)
  const isPrimitive = !isObj && !isArray

  const state = isObj || isArray ?
    reactive(structuredClone(defaultValue)) :
    ref(defaultValue)

  const store = {
    state,

    get() {
      return isObj || isArray ? state : state.value
    },

    set(value) {

      if (!isTypeMatch(value, defaultValue)) {
        throw new TypeError(`[${name}] set 型態錯誤：接收到 ${JSON.stringify(value)}`)
      }

      if (isObj) {
        Object.assign(state, value)
      } else if (isArray) {
        state.splice(0, state.length, ...value)
      } else {
        state.value = value
      }

      // ⭐ 修正這段
      if (storageKey) {
        try {
          // 把 reactive 轉成純資料再存
          const dataToSave = isObj || isArray ?
            JSON.parse(JSON.stringify(state)) // ← 安全地去掉 Proxy
            :
            value

          localStorage.setItem(storageKey, JSON.stringify(dataToSave))
          // console.log(`[${name}] saved to localStorage`, dataToSave)
        } catch (err) {
          console.warn(`[${name}] 儲存到 localStorage 失敗`, err)
        }
      }
    },


    clear() {
      if (isObj || isArray) {
        store.set(structuredClone(defaultValue))
      } else {
        state.value = defaultValue
      }
      if (storageKey) localStorage.removeItem(storageKey)
    },

    loadFromStorage() {

      if (!storageKey) return
      try {
        const raw = localStorage.getItem(storageKey)
        if (raw !== null) {
          try {
            store.set(JSON.parse(raw))
          } catch {
            // 向下相容：如果不是 JSON，當成 primitive
            store.set(raw)
          }
        }

      } catch (err) {
        console.warn(`[${name}] 讀取 localStorage 失敗`, err)
      }
    }
  }

  if (actions) {
    Object.entries(actions).forEach(([key, fn]) => {
      store[key] = (...args) => fn(store, ...args)
    })
  }

  store.loadFromStorage()
  return store
}