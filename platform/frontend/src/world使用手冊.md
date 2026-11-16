# World 使用手冊

`world.js` 匯出目前前端的 World 單例。一般頁面與模組透過它取得已註冊的 Store、Service、API 與 Router。應用程式由 [main.js](./main.js) 完成啟動後才掛載 Vue。

```js
import world from '@/world.js'
```

## 啟動、設定與診斷

| 入口 | 用途 |
|---|---|
| `await world.start()` | 應用程式入口載入目前 Project、啟動平台並建立 Router。同時發起的啟動共用同一次初始化。 |
| `world.started` | 查看初始化是否已完成。 |
| `world.projectConfig()` | 取得當前 Project 設定，例如 `name`、`title`、`tenant_id`。呼叫端以讀取為主。 |
| `world.getContext()` | 取得當前啟動情境的唯讀淺層副本，例如 `projectName`、`url`、`host`。尚未建立情境時回傳 `null`。 |
| `world.appProps()` | 取得 boot 產生的應用程式根元件參數。 |
| `world.router()` | 取得平台建立的 Vue Router。元件也可使用 Vue Router 的 `RouterLink` 或 `useRouter()`。 |
| `world.list()` | 檢查已註冊的 Store、已建立的 Store 實例、Service 及路由。 |
| `await world.reset()` | 由平台清理使用者與模組執行狀態，再以目前 Project 設定執行 boot。 |
| `world.dispose()` | 由應用程式結束時銷毀 Container 並解除 Router 持有者。 |

一般頁面在應用程式完成 `start()` 後使用上述能力。 `start`、`reset` 與 `dispose` 由應用程式生命週期呼叫。重置執行狀態與清除 IndexedDB 是兩個獨立操作。

## Store

`world.store(name)` 取得已註冊的 Store。跨模組使用選配能力前，先以 `world.hasStore(name)` 檢查。平台核心 Store 包含 `auth`、`lifecycle`、`module`、`platformConfig`、`token`。

```js
const auth = world.store('auth')
const loggedIn = auth.isLoggedIn()

const notes = world.hasStore('notes') ? world.store('notes') : null
```

`world.createStore(options)` 建立 Store。模組將 factory 交給 `setup.stores`，由平台安裝流程註冊。

```js
export default {
  name: 'notes',
  setup: {
    stores: {
      notes: () => world.createStore({
        name: 'notes',
        defaultValue: { selectedId: null },
        actions: {
          select(store, id) {
            store.set({ selectedId: id })
          }
        }
      })
    }
  }
}
```

Store 可透過 `state`、`get()` 讀取狀態，使用 `set(value)` 更新、`clear()` 清回預設值。需要 Store 持久化時可設定 `storageKey`、`persistKeys` 與 `persistDelay`。這組設定使用瀏覽器 localStorage。需保存 IndexedDB 紀錄時，使用下方的 `world.iDB`。

## HTTP 與登入

`world.http()` 提供 `get(path, options?)` 與 `post(path, body, options?)`。兩者回傳 `{ ok, status, data }`。平台依請求選項附加 Project 標頭，若有 Token 則附上登入憑證。

```js
const result = await world.http().get('/api/example')
if (!result.ok) throw new Error(`讀取失敗（${result.status}）`)
```

`world.authApi()` 提供 `login(payload)`、`logout()`、`session()`、`restoreSession()`。登入表單呼叫 `login`，需要恢復本機 Session 時呼叫 `restoreSession`，畫面透過 `world.store('auth')` 取得登入狀態。

```js
const result = await world.authApi().login({ username, password })
if (!result.ok || !world.store('auth').isLoggedIn()) {
  throw new Error(result.data?.error?.message || '登入失敗')
}
```

`world.apiMode()` 回傳 `real` 或 `mock`。設定 `VITE_API_MODE` 可指定模式。這個方法回報模式，實際資料來源由對應 API 呼叫端處理。

## Service 與 UI 插槽

| 入口 | 用途 |
|---|---|
| `world.service(name)` | 取得 Container 已註冊的 Service。 |
| `world.services.<name>(...args)` | 取得物件型 Service，或呼叫函式型 Service。 |
| `world.services.eventBus()` | 取得事件匯流排，支援 `on`、`off`、`emit`。訂閱者離開頁面時應使用相同的 handler 解除訂閱。 |
| `world.services.resolveNavProjection(routes, options?)` | 依路由的 `meta.nav` 等欄位整理各區域的導覽項目。 |
| `world.services.storage()` | 共用本機鍵值儲存，提供 `get`、`set`、`remove`、`list`、`batch`。鍵值格式與降級行為見 [Storage 契約](./app/container/services/storage.md)。 |
| `world.services.indexedDb({ tenantId, module })` | 取得已限定租戶與模組的 IndexedDB Service。一般頁面可用下方的 `world.iDB`。 |
| `world.services.indexedDbBackup()` | 供既有 IndexedDB 結構接入備份。由呼叫端明確指定資料庫、Object Store 或快照方法。 |

`world.registerUISlot(slotName, descriptor)` 是平台註冊 UI 插槽的入口。模組透過 `setup.ui.slots` 宣告內容，平台安裝時代為註冊。專案 Layout 必須有相同名稱的 `UiSlot` 才會呈現。

```js
// 將 ui 放在模組的 setup.ui。
const ui = {
  slots: {
    'notes-toolbar': {
      component: () => import('./components/NotesToolbar.vue'),
      order: 10,
      access: { public: false, auth: true }
    }
  }
}
```

## IndexedDB 讀寫與備份

`world.iDB` 會讀取目前 Project 的 `tenant_id`，再以模組名稱隔離資料庫。分類與紀錄 ID 由資料擁有者指定。每次 `save` 都會產生新的寫入版本，供上傳後安全比對。

```js
const record = { module: 'notes', category: 'history', id: '42' }

await world.iDB.save({ ...record, data: { text: '會議筆記' } })
const note = await world.iDB.get(record) // 找不到時回傳 undefined
const entries = await world.iDB.list({ module: 'notes', category: 'history' })
// entries 格式為 [{ id, data }]
await world.iDB.remove(record)
```

### 共用備份元件

匯入 [IndexedDbBackupButton](./components/IndexedDbBackupButton.vue) 後，傳入模組、分類及上傳方法即可使用。傳一個分類會提供單一分類入口，傳多個分類可讓使用者從視窗選擇。下例的 `/api/notes/backup` 是專案自行實作並授權的端點。

```js
import IndexedDbBackupButton from '@/components/IndexedDbBackupButton.vue'

const backupCategories = [
  { id: 'history', label: '筆記歷史', allowCleanup: true },
  { id: 'settings', label: '筆記設定' }
]

async function saveNotesBackup(payload) {
  const { ok, data } = await world.http().post('/api/notes/backup', payload)
  if (!ok) throw new Error(data?.error?.message || '備份上傳失敗')
  return data
}
```

直接使用預設備份按鈕。

```pug
IndexedDbBackupButton(module="notes" :categories="backupCategories" :upload="saveNotesBackup")
```

使用自己的按鈕或連結時，將插槽提供的 `trigger` 綁到要觸發的元素。

```pug
IndexedDbBackupButton(module="notes" :categories="backupCategories" :upload="saveNotesBackup")
  template(#default="{ trigger, busy }")
    button.my-button(type="button" v-bind="trigger" :disabled="busy") 備份筆記
```

連結可用 `a(href="#" v-bind="trigger") 備份筆記`。觸發屬性會攔下預設導覽。元件負責顯示操作結果；需要自行管理結果的頁面可直接呼叫 `world.iDB.upload({ module, categories, upload })`。

`allowCleanup: true` 會顯示清除選項，預設未勾選。伺服器完成儲存並回傳 `{ success: true }` 後，才清除快照中版本未變動的紀錄。新的紀錄、已更新的紀錄及其他分類都會保留。

頁面可根據回傳的 `status` 顯示結果。`cancelled` 表示取消，`busy` 表示已有備份操作，`uploaded` 表示上傳成功，`uploaded-and-cleaned` 另提供清除筆數 `cleared`。若已上傳但本機清除失敗，會回傳 `uploaded-cleanup-failed`。快照讀取或上傳失敗會拋出錯誤。資料格式、舊資料分類和伺服器回執詳見 [IndexedDB 讀寫與備份契約](./app/container/services/indexed-db-backup.md)。
