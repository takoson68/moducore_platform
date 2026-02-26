# Storage Capability（Local-first / Phase 1）

此能力是 `services` 底下的 capability。

- 不暴露在 `world` 第一層（禁止 `world.storage()`）
- 唯一取得方式：`world.services.storage()`
- 禁止直接 import `storageService` 或底層 driver

## 責任分離（store vs storage）

- `storage`：本地 I/O 能力（讀寫 local-first 資料）
- `store`：前端狀態唯一事實來源（Single Source of Truth）
- `storage` 不持有 reactive state

正確資料流：

- `storage.get(...)` -> 寫回 `store.state`
- `store.state` 更新 -> `storage.set(...)`

## Contract（固定 API）

僅提供以下 async 方法：

- `get(key)`
- `set(key, value)`
- `remove(key)`
- `list(prefix?)`
- `batch(ops)`

## Namespace Key 命名規則（強制）

- key 必須至少兩層 namespace（使用 `:` 分隔）
- 不符合規則會直接 throw
- 建議格式：`"{module}:{entity}:{id?}"`

範例：

- `tasks:list`
- `tasks:item:42`
- `vote:draft:session-1`

## Usage 範例（可直接照抄）

### 範例 1：初始化時讀取 storage 並寫回 store.state

```js
const storage = world.services.storage()
const taskStore = world.store('task')

const cachedList = await storage.get('tasks:list')
if (Array.isArray(cachedList)) {
  taskStore.state.list = cachedList
}
```

### 範例 2：store.state 更新後回寫 storage

```js
const storage = world.services.storage()
const taskStore = world.store('task')

async function saveTasks() {
  await storage.set('tasks:list', taskStore.state.list)
}
```

### 範例 3：批次寫入與刪除（batch）

```js
const storage = world.services.storage()

await storage.batch([
  { type: 'set', key: 'tasks:item:101', value: { id: 101, title: '整理清單' } },
  { type: 'set', key: 'tasks:item:102', value: { id: 102, title: '同步狀態' } },
  { type: 'remove', key: 'tasks:item:099' }
])
```

### 範例 4：依 prefix 列出模組資料

```js
const storage = world.services.storage()

const taskItems = await storage.list('tasks:item')
// 回傳格式：[{ key, value }, ...]
```

## Auto Fallback（IndexedDB -> memory）

- 預設 driver 為 IndexedDB（idbDriver）
- 若 IDB 初始化失敗或 transaction 失敗：
  - 自動降級到 memoryDriver（Map）
  - `console.warn` 僅記錄一次（避免洗版）
- 降級後 API contract 不變
- 降級後資料不保證在 reload 後仍存在

## Throw 策略

- key 不符合 namespace 規則 -> throw
- `set` / `batch(set)` 的 value 無法儲存（structured clone / circular 等） -> throw
- driver 錯誤：
  - 非降級情境 -> throw
  - 降級情境（IDB init/transaction 失敗） -> 切換 memoryDriver 並重試

## Phase 1 不做事項（明確排除）

- 白名單治理
- migration / 多 objectStore
- debounce queue
- hydrate 流程
- 假資料機制
- token/XSS 規則引擎
- lifecycle 管理

