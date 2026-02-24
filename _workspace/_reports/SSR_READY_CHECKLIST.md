# ModuCore Platform 前端 SSR-ready（預留空間）清單

## 1) 範圍與目標

- 本文件僅定義 `platform/frontend` 在未來導入 SSR 前應先預留的介面、責任與禁止事項。
- 本文件目標是讓未來 SSR 改動可集中在 `platform/frontend/src/world.js`（作為 World Adapter），避免分散修改。
- 本文件只描述「SSR-ready 空間」與邊界，不包含實作細節與改碼步驟。

## 2) 非目標

- 現在不做 SSR。
- 現在不改核心（包含 container/store/ui registry/router 既有核心邏輯）。
- 現在不修改其他既有檔案（本次僅新增本文件）。

## 3) SSR-ready 的 World Adapter Contract（僅介面與責任）

### 3.1 必要介面（`platform/frontend/src/world.js` 未來對外契約）

- `createWorld(context)`
  - 責任：建立單次 runtime/world instance（未來 SSR request 與 CSR 啟動皆可用）
  - 對應檔案責任：`platform/frontend/src/world.js`

- `prepare(context)`
  - 責任：完成共用初始化流程（store/register/boot/router 前置），不做 DOM 掛載
  - 對應檔案責任：`platform/frontend/src/world.js` 聚合 `main.js` / `router/index.js` / `app/*`

- `clientBoot()`
  - 責任：只處理 client 端掛載/接手（hydrate 或 CSR mount）
  - 對應檔案責任：未來 client entry 與 `world.js` 的 client 階段

- `exportState()`
  - 責任：匯出可序列化的初始狀態（供 SSR -> client 傳遞）
  - 對應檔案責任：`world.js`（統一收斂 state 來源）

- `restoreState()`
  - 責任：在 client 端恢復序列化狀態，不重跑多餘初始化
  - 對應檔案責任：`world.js`（避免 CSR 多跑一次 init）

### 3.2 Runtime Context 欄位最小集合（`context`）

- `isServer`
  - 責任：server/client 分流主判斷
  - 對應風險檔案：`src/router/index.js`、`src/app/api/apiMode.js`、`src/app/container/register.js`

- `url`
  - 責任：server 端 router 初始路由定位
  - 對應風險檔案：`src/router/index.js`

- `headers`
  - 責任：server 端 API / session 決策輸入（不直接讀 browser 狀態）
  - 對應風險檔案：`src/app/api/*`

- `host`
  - 責任：server/client 一致的 API mode 判定輸入
  - 對應風險檔案：`src/app/api/apiMode.js`

- `initialState`
  - 責任：SSR 輸出 state 與 client restore 的交接資料
  - 對應風險檔案：`src/app/stores/_storeFactory.js`（避免直接用 localStorage 當唯一來源）

- `projectName`
  - 責任：取代散落的環境推斷，統一 project 決策來源
  - 對應風險檔案：`src/world.js`、`src/app/api/index.js`、`projects/loadProject.js`

### 3.3 依賴來源收斂（getter 契約）

- `getRoutesBucket()`
  - 契約：回傳 `{ public, auth, all }` 的唯讀結構
  - 目的：取代 `window.__MODULE_ROUTES__` 直接讀寫
  - 對應檔案：
    - `src/app/container/register.js`
    - `projects/project-a/modules/index.js`
    - `projects/project-b/modules/index.js`
    - `projects/project-a/components/ProjectSidebar.vue`
    - `projects/project-a/components/ProjectTopbar.vue`
    - `projects/project-b/components/ProjectSidebar.vue`
    - `projects/project-b/components/ProjectTopbar.vue`

- `getApiMode()`
  - 契約：由 world/context 提供 mode 結果，不依賴 `window.location`
  - 目的：讓 server 模式不碰 browser API
  - 對應檔案：
    - `src/app/api/apiMode.js`
    - `src/world.js`

- `getInitialState()`
  - 契約：提供 prepare/restore 使用的統一 state 來源（SSR 注入或 CSR 預設）
  - 目的：避免 store 在建立時直接讀 `localStorage`
  - 對應檔案：
    - `src/app/stores/_storeFactory.js`
    - `src/world.js`

## 4) SSR 安全禁止清單（server 模式）

### 4.1 禁止直接碰 browser globals（server 模式）

- 禁止直接使用 `window`
- 禁止直接使用 `document`
- 禁止直接使用 `localStorage`
- 禁止直接呼叫 `dispatchEvent` / `CustomEvent`
- 禁止以 `window.location` 作為 runtime 判定來源

### 4.2 已知風險點（檔案 / 風險）

- `platform/frontend/src/app/container/register.js`
  - 風險：直接寫 `window.__MODULE_ROUTES__`
  - 風險：直接 `window.dispatchEvent(new CustomEvent(...))`
  - 禁止事項：server 模式下不得執行這些 browser 依賴分支

- `platform/frontend/src/app/stores/_storeFactory.js`
  - 風險：建立 store 後立即 `loadFromStorage()`
  - 風險：`set()/clear()/loadFromStorage()` 直接使用 `localStorage`
  - 禁止事項：server 模式下不得以 `localStorage` 作為初始化來源

- `platform/frontend/src/app/api/apiMode.js`
  - 風險：直接讀 `window.location.hostname`
  - 禁止事項：server 模式下不得依賴 `window.location`

- `platform/frontend/projects/project-a/modules/index.js`
  - 風險：`buildModuleRoutes()` 直接讀 `window.__MODULE_ROUTES__`
  - 風險：模組級 `installedModules` 在 SSR 可能跨 request 共用
  - 禁止事項：server 模式下不得以 `window` 為 routes bucket 唯一來源

- `platform/frontend/projects/project-b/modules/index.js`
  - 風險：同上（`window.__MODULE_ROUTES__` 與模組級安裝狀態）
  - 禁止事項：同上

- `platform/frontend/projects/project-a/components/ProjectSidebar.vue`
  - 風險：computed 直接讀 `window.__MODULE_ROUTES__`
  - 禁止事項：server render 時不得直接讀 `window`

- `platform/frontend/projects/project-a/components/ProjectTopbar.vue`
  - 風險：computed 直接讀 `window.__MODULE_ROUTES__`
  - 禁止事項：server render 時不得直接讀 `window`

- `platform/frontend/projects/project-b/components/ProjectSidebar.vue`
  - 風險：computed 直接讀 `window.__MODULE_ROUTES__`
  - 禁止事項：server render 時不得直接讀 `window`

- `platform/frontend/projects/project-b/components/ProjectTopbar.vue`
  - 風險：computed 直接讀 `window.__MODULE_ROUTES__`
  - 禁止事項：server render 時不得直接讀 `window`

### 4.3 效能與行為禁止事項（配合本文件目標）

- 禁止為了 SSR-ready 在 CSR 路徑多跑一次 init（例如重複 `world.start()` 或等價 prepare）
- 禁止新增常駐監聽作為 SSR-ready 的替代方案（例如全域輪詢、額外常駐事件橋接）
- 禁止在 `main.js` 現行 CSR 路徑加入雙重 bootstrap 流程

## 5) 未來真的要 SSR 時的最小改造順序（Phase 1~3）

### Phase 1：先建立 World Adapter 骨架（不拆核心邏輯）

- 在 `platform/frontend/src/world.js` 定義 World Adapter 契約（`createWorld(context)` / `prepare(context)` / `clientBoot()` / `exportState()` / `restoreState()`）
- 保留現有初始化順序語意（store -> project config -> boot -> router），避免 CSR 行為漂移
- 將 `platform/frontend/src/main.js` 的啟動責任收斂為呼叫 World Adapter（不增加重複 init）
- 為 `platform/frontend/src/router/index.js` 預留 history provider 參數（server/client 分流入口）

### Phase 2：收斂依賴來源到 World（讓改動集中）

- 在 `world.js` 提供 routes bucket getter，逐步替代 `window.__MODULE_ROUTES__` 直接使用
- 在 `world.js` 提供 api mode getter/context 判定，避免 `src/app/api/apiMode.js` 直接碰 `window.location`
- 在 `world.js` 提供 initial state getter/restore 流程，避免 `src/app/stores/_storeFactory.js` 以 `localStorage` 作為唯一初始化來源
- 將 `router/holder`、`uiRegistry`、container 等共享狀態的取得路徑優先透過 world 收口（至少先有 adapter 層，不先重寫核心）

### Phase 3：啟用 SSR 最小路徑（再動邊界）

- 新增 SSR 專用 entry（server/client 分流），但 CSR 啟動仍維持單次初始化
- `platform/frontend/src/router/index.js` 支援 `createMemoryHistory()`（server）與 `createWebHistory()`（client）
- 將 server render 所需資料透過 `exportState()/restoreState()` 交接，避免 client 再次完整初始化
- 驗證 project-a / project-b 的 topbar/sidebar 在 server render 不直接碰 `window`

## 6) 驗收條件（可驗證）

- `platform/frontend/src/main.js` 的 CSR 啟動路徑在一次頁面載入中僅執行一次初始化（可用 log/計數驗證 `world.start()` 或等價 prepare 未重複執行）
- 未來導入 SSR 後，server 模式執行 `prepare(context)` 時不會因 `window/document/localStorage/dispatchEvent` 拋出錯誤
- `platform/frontend/src/router/index.js` 可在 server/client 兩種模式下建立 router（server 不使用 `createWebHistory()`）
- `project-a` 與 `project-b` 的 `ProjectSidebar.vue` / `ProjectTopbar.vue` 在 server render 路徑不直接依賴 `window.__MODULE_ROUTES__`
- CSR 效能不退化：與現行流程相比，不新增第二次 bootstrap、不新增常駐監聽
- SSR-ready 階段完成後，未修改 `world.js` 以外的核心檔案責任定義（變更應可在 code review 中明確追蹤到 world adapter 與少數邊界檔）

