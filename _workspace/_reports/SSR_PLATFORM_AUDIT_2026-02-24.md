# ModuCore Platform 前端 SSR 健檢報告（World-first 審計）

日期：2026-02-24  
範圍：`platform/frontend`（含 `src/*`、`router/*`、`app/*`、`projects/*`）  
裁決原則：`World-first Integration`（Core 視為能力資源，流程/模式/context 由 `world.js` 收斂）

## 1) 結論摘要

- **SSR-ready 評級：5.5 / 10**
- `world.js` 已完成一輪關鍵升級（Pipeline + Runtime Context Ownership 骨架），方向正確且符合 World-first。
- 目前仍有數個 **P0 blocker**：固定 `createWebHistory()`、`register.js` 直接操作 `window`/`dispatchEvent`、store 建立即讀 `localStorage`、`projects/*` 直接讀 `window.__MODULE_ROUTES__`。
- 若以 World-first 原則實作，SSR 不需要重寫核心，但仍必須動到少數邊界檔（router / register / storeFactory / entry / projects route bucket 使用點）。

## 2) Blockers 分級清單

### P0（必做才能 SSR）

1. **Router 固定 `createWebHistory()`（SSR blocker）**
- 證據：`platform/frontend/src/router/index.js:7,15`
- 行為：`createAppRouter()` 目前固定使用 `createWebHistory()`，沒有 `createMemoryHistory()` 分流入口。
- SSR 錯誤型態：server render 建 router 時依賴 browser history，導致 SSR 初始化失敗或行為不正確。
- World-first 判定：屬於邊界檔（router builder）必改，但分流決策應由 `world.js` 的 runtime context 決定。

2. **`register.js` 在啟動流程中直接碰 `window` / `dispatchEvent`**
- 證據：`platform/frontend/src/app/container/register.js:16-20,156`
- 行為：`ensureRouteBucket()` 直接寫 `window.__MODULE_ROUTES__`；`routes()` 最後直接 `window.dispatchEvent(new CustomEvent(...))`。
- 觸發路徑：`world.prepare()` 內呼叫 `boot()`（`platform/frontend/src/world.js:64,81`），`boot()` 內會建立 `register` 並執行 modules 安裝（`platform/frontend/src/app/boot/boot.js:11-25` + `registerAllowedModules()`）。
- SSR 錯誤型態：server 模式執行 module route 註冊時直接 `ReferenceError: window is not defined`。
- World-first 判定：應由 `world.getRoutesBucket()` / world-owned event interface 收斂，再讓 `register` 走 provider/fallback。

3. **Store 建立即讀 `localStorage`（SSR blocker）**
- 證據：`platform/frontend/src/app/stores/_storeFactory.js:80-106`
- 行為：`createStore()` 結尾直接 `store.loadFromStorage()`（第 106 行）；`loadFromStorage()` 直接讀 `localStorage`（第 84 行）。
- SSR 錯誤型態：server 建 store 時觸發 browser-only API（即使部分例外被 catch，也會造成 SSR 初始化不穩定與 hydration mismatch 風險）。
- World-first 判定：初始化來源應由 `world.getInitialState()` / `world.effects()`（client-only）接管，核心 store factory 不應自行決定 runtime 存取來源。

4. **`projects/*` 組件與 modules 直接讀 `window.__MODULE_ROUTES__`（SSR render blocker）**
- 證據：
  - `platform/frontend/projects/project-a/components/ProjectSidebar.vue:11`
  - `platform/frontend/projects/project-a/components/ProjectTopbar.vue:27`
  - `platform/frontend/projects/project-b/components/ProjectSidebar.vue:11`
  - `platform/frontend/projects/project-b/components/ProjectTopbar.vue:27`
  - `platform/frontend/projects/project-a/modules/index.js:71`
  - `platform/frontend/projects/project-b/modules/index.js:80`
- 行為：computed / route builder 直接取 `window.__MODULE_ROUTES__`。
- SSR 錯誤型態：server render 計算 computed 或執行 `buildModuleRoutes()` 時直接 `window is not defined`。
- World-first 判定：先由 `world.getRoutesBucket()` 建契約（已存在），再逐步切換使用點。

5. **目前沒有 SSR entry 分流（只有 CSR `main.js`）**
- 證據：`platform/frontend/src/main.js:8,10,15`；`platform/frontend/src` 未找到 `entry-client.js` / `entry-server.js`
- 行為：只有 `main.js` 走 `await world.start()` -> `createApp(...).mount('#app')` 的純 CSR 路徑。
- SSR 錯誤型態：無法建立 server render 與 client hydrate 的標準入口。
- World-first 判定：entry 是邊界檔必改，但應保持 `world` 作為唯一流程 orchestrator。

### P1（影響一致性 / 可維護）

1. **`world.js` 仍為模組單例，SSR request-scope 汙染風險高**
- 證據：`platform/frontend/src/world.js:292` `export default new World()`
- 行為：整個 Node 進程共用同一個 `World` instance。
- SSR 錯誤型態：跨 request state leak（router、appProps、projectConfig、context、API mode/headers 決策殘留）。
- World-first 判定：`World` 應是 runtime owner；SSR 時需 `createWorld(context)` 工廠化。CSR 可暫保留 default singleton 相容。

2. **Router holder 為 module-global**
- 證據：`platform/frontend/src/router/holder.js:2,4,8`
- 行為：`let _router = null` 全域持有，`setRouter/getRouter` 共享同一實例。
- SSR 錯誤型態：並行 request 交錯時可能取到錯誤 router 實例或互相覆蓋。
- World-first 判定：可過渡保留，但最終應由 `world.router()` 為主、holder 退為 fallback。

3. **Container 為 module-global，會保存 factories/instances**
- 證據：`platform/frontend/src/app/container/container.js:4,88`
- 行為：`export const container = new Container()`；內含 `factories` / `instances` Map。
- SSR 錯誤型態：跨 request store instance 殘留、重複註冊行為差異、使用者狀態污染。
- World-first 判定：核心可維持能力實作，但 SSR 時需 world-scoped/request-scoped 容器實例（屬邊界擴充）。

4. **UI registry 為 module-global**
- 證據：`platform/frontend/src/app/uiRegistry.js:5-6`
- 行為：`slotMap` 與 `uiRegistryVersion` 在模組層常駐。
- SSR 錯誤型態：請求間 UI slot 重複累積、順序不一致。
- World-first 判定：應逐步收口到 world 持有的 UI registry 入口或 request-scope 實例。

5. **API projectName 為 module-global**
- 證據：`platform/frontend/src/app/api/index.js:4,6`
- 行為：`let projectName = null` 由 `initApi()` 寫入。
- SSR 錯誤型態：多租戶/多 project host 下跨 request 覆蓋 `X-Project` header。
- World-first 判定：`world._context.projectName` 已建立，下一步需把 API 初始化與 request context 綁定。

6. **Project modules registry 使用模組級 `loadedModules` / `installedModules`**
- 證據：
  - `platform/frontend/projects/project-a/modules/index.js:15-16,41,66`
  - `platform/frontend/projects/project-b/modules/index.js:18,20,47,74`
- 行為：模組載入/安裝狀態跨整個 process 共用。
- SSR 錯誤型態：第二個 request 跳過安裝流程，導致 routes/ui/stores 不完整或沿用前一請求狀態。
- World-first 判定：module code 可保留，安裝狀態至少需 world/request-scope 化。

### P2（體驗優化 / 可觀測性）

1. **`boot()` 的 browser-only 副作用尚未分段到 `effects()`（world pipeline 對齊度不足）**
- 證據：`platform/frontend/src/world.js:64-83`（`prepare()` 內直接 `await boot()`）；`platform/frontend/src/app/boot/boot.js:25,92-97`
- 行為：`boot()` 在 world `prepare()` 執行，且其中包含 `exposeResetHook()`（雖有 `typeof window !== 'undefined'` guard）。
- 風險：目前不一定炸，但混合 browser-only 副作用在 `prepare()` 會降低 SSR 語義清晰度。
- World-first 判定：`prepare()` 應偏向可在 server 執行；`effects()` 承接 browser-only 行為更符合邊界設計。

2. **`world.getRoutesBucket()` 已建立，但使用點尚未切換**
- 證據：`platform/frontend/src/world.js:197-214`
- 行為：world 已提供穩定 shape 契約，外部仍直接讀 `window.__MODULE_ROUTES__`。
- 價值：這是正確的 Phase 0 預留；接下來要把使用點逐步收斂到 world。

3. **Browser Globals 掃描噪音（第三方 vendor）需在審計時排除**
- 證據：`platform/frontend/projects/project-b/modules/mtk2mad/vendors/*` 大量 `window/document` 命中
- 說明：多為第三方前端資產，需區分「專案可控平台碼」與「vendor 瀏覽器庫」。

## 3) 以 World-first 角度提出最小改造路徑

### Phase 0：只動 `world.js` 可先做的 SSR-ready 預留（不碰核心）

1. **保留既有 `start()` 相容入口，補齊 World Adapter 契約骨架**
- 目前已做：`prepare / activate / effects`、`_context`、`getApiMode / getInitialState / getRoutesBucket`。
- 下一步建議：在 `world.js` 補 `exportState()` / `restoreState()`（先空實作或薄包裝也可），建立完整契約命名。

2. **新增 `createWorld(context)` 工廠（不破壞 CSR）**
- 保留 `export default new World()` 給現行 CSR。
- SSR entry 未來改走 `createWorld()`，避免 request-scope 汙染。

3. **強化 runtime context ownership（只在 world 收斂，不改使用點）**
- 已有最小欄位：`isServer/url/host/headers/initialState/projectName`。
- 建議補只讀 getter（如 `context()` / `getContext()`）供 debug/audit 使用，避免其他層自行推斷。

4. **明確標記 pipeline 語義（`prepare` 可 server、`effects` client-only）**
- 即使短期仍由 `prepare()` 呼叫完整 `boot()`，至少在 world 內保留責任註記，避免未來再次把 browser-only 邏輯散落回核心。

### Phase 1：SSR 真要成立時必動的少數邊界檔（必做）

1. **`src/router/index.js`：支援 `createMemoryHistory()` / `createWebHistory()` 分流**
- 邊界責任：router builder 接受 world/context 的 history provider 或 `isServer`。
- 原則：router 僅負責建構；模式分流決策仍由 world 決定。

2. **新增 `entry-client` / `entry-server`，保留 `main.js` CSR 行為單次初始化**
- `entry-server`：`createWorld(context)` -> `prepare()` -> router push/url -> render。
- `entry-client`：hydrate/mount，避免二次完整 bootstrap。

3. **`src/app/container/register.js`：將 routes bucket 與 routes-updated event 改為可注入 provider / notifier**
- 過渡策略：保留 `window` fallback，但優先走 world 提供的 bucket / notifier。
- 目標：server 路徑不碰 `window` / `CustomEvent`。

4. **`src/app/stores/_storeFactory.js`：移除建立時強制 `loadFromStorage()`（或加 client-only gate）**
- 由 world（`prepare`/`effects`）決定何時 restore state / storage hydrate。
- 避免核心資源自行決定 runtime 行為。

### Phase 2：逐步收斂散落依賴（projects/components 等）

1. **Projects modules/components 改用 world routes bucket 契約**
- 先替換 `window.__MODULE_ROUTES__` 讀取點（`ProjectSidebar.vue` / `ProjectTopbar.vue` / `buildModuleRoutes()`）。
- 收斂到 `world.getRoutesBucket()` 或 world 注入的 nav projection service。

2. **Modules 安裝狀態 request-scope 化**
- `installedModules` 不再作為 process-global 真實狀態來源。
- 可先由 world/context 管理「本次 runtime 已安裝集合」，模組檔保留載入能力。

3. **UI registry / router holder / API projectName 逐步改為 world-first 取得路徑**
- 不一定一次重寫核心實作，但上層依賴先改走 `world`。
- 減少跨 request 汙染風險與 hidden global coupling。

4. **把 `boot()` 中 browser-only 副作用下沉到 world `effects()` 階段**
- 例如 reset hook 暴露、DOM/event 相關效果。
- 讓 `prepare()` 更接近 server-safe 的純初始化段。

## 4) 附錄：Evidence 索引（按檢查項目）

### A) Browser Globals 掃描（SSR 常見炸點）

#### A-1. `window` / `location` / routes bucket（平台碼）
- `platform/frontend/src/world.js:112-113`
  - `_normalizeContext()` 在 client 下讀 `window.location`（已有 `typeof window !== 'undefined'` guard，屬受控 fallback）。
- `platform/frontend/src/world.js:200-204`
  - `getRoutesBucket()` 在 client fallback 讀 `window.__MODULE_ROUTES__`（server path 有 guard）。
- `platform/frontend/src/router/routes.js:9`
  - `getRouteBucket()` 用 `typeof window !== 'undefined'` 讀 bucket（SSR 相對安全，但仍是 window bucket 模式）。
- `platform/frontend/src/app/api/apiMode.js:5`
  - 直接 `window.location.hostname`（**server path 無 guard**）。

#### A-2. `window` / `dispatchEvent` / `CustomEvent`（啟動流程會碰）
- `platform/frontend/src/app/container/register.js:16-20`
  - `ensureRouteBucket()` 直接讀寫 `window.__MODULE_ROUTES__`。
- `platform/frontend/src/app/container/register.js:156`
  - `window.dispatchEvent(new CustomEvent('moducore:routes-updated'))`。
- 觸發位置：`platform/frontend/src/app/boot/boot.js` 中 modules 安裝流程會使用 `createRegister(container)` 並呼叫 `register.routes(...)`。

#### A-3. `localStorage`（store 初始化/操作）
- `platform/frontend/src/app/stores/_storeFactory.js:62,77,84`
  - `setItem/removeItem/getItem` 直接操作 `localStorage`。
- `platform/frontend/src/app/stores/_storeFactory.js:106`
  - `createStore()` 結尾立即 `store.loadFromStorage()`。

#### A-4. `window`（projects/components SSR render 路徑高風險）
- `platform/frontend/projects/project-a/components/ProjectSidebar.vue:11`
- `platform/frontend/projects/project-a/components/ProjectTopbar.vue:27`
- `platform/frontend/projects/project-b/components/ProjectSidebar.vue:11`
- `platform/frontend/projects/project-b/components/ProjectTopbar.vue:27`
  - computed 直接讀 `window.__MODULE_ROUTES__`。

#### A-5. `window`（projects/modules route builder）
- `platform/frontend/projects/project-a/modules/index.js:71`
- `platform/frontend/projects/project-b/modules/index.js:80`
  - `buildModuleRoutes()` 直接讀 `window.__MODULE_ROUTES__`。

#### A-6. `window`（boot reset hook，已有 guard）
- `platform/frontend/src/app/boot/boot.js:92-97`
  - `exposeResetHook()` 在 `typeof window !== 'undefined'` 下寫入 `window.__MODUCORE_RESET_WORLD__`。
  - 目前有 guard，但位於 `boot()` 流程內，建議未來分段到 `world.effects()`。

> 註：掃描命中 `platform/frontend/projects/project-b/modules/mtk2mad/vendors/*` 等第三方 vendor 檔案（大量 `window/document`），屬瀏覽器庫常見情況；本報告主要聚焦平台可控碼與 project 整合碼。

### B) Router SSR 相容性
- `platform/frontend/src/router/index.js:7,14-15`
  - `createAppRouter()` 使用 `createRouter({ history: createWebHistory() })`。
- 未找到 `createMemoryHistory` 使用點（掃描 `platform/frontend/src/router` 結果）。
- 判定：**P0 SSR blocker**。

### C) 全域單例 / holder 污染點（request-scope 問題）
- `platform/frontend/src/world.js:292`：`export default new World()`（world 單例）。
- `platform/frontend/src/router/holder.js:2`：`let _router = null`（router holder module-global）。
- `platform/frontend/src/app/container/container.js:88`：`export const container = new Container()`（container module-global，保存 factories/instances）。
- `platform/frontend/src/app/uiRegistry.js:5-6`：`slotMap` + `uiRegistryVersion` module-global。
- `platform/frontend/src/app/api/index.js:4`：`let projectName = null`（API context module-global）。
- `platform/frontend/projects/project-a/modules/index.js:15-16` / `project-b/modules/index.js:18,20`
  - `loadedModules` / `installedModules` module-global。

### D) Boot 流程 SSR 安全性
- `platform/frontend/src/world.js:64-83`
  - `prepare()` 內直接執行 `boot({ projectConfig })` 與 `createAppRouter()`。
- `platform/frontend/src/app/boot/boot.js:11-25`
  - `boot()` 內含 module 註冊與 `exposeResetHook()` 呼叫。
- `platform/frontend/src/app/boot/boot.js:92-97`
  - `exposeResetHook()` 有 `window` guard，但屬 browser-only 副作用。
- 判定：**目前 `boot()` 落在 prepare 段，語義上不理想；因 `register.routes()` 內 window 操作，實際已成 P0 blocker。**

### E) Store 初始化與 Storage
- `platform/frontend/src/app/stores/_storeFactory.js:80-106`
  - `loadFromStorage()` + `createStore()` 結尾立即呼叫。
- 判定：**P0 blocker**（SSR server 建 store 時會觸發 browser-only API）。
- World-first 收斂策略：`world.getInitialState()` / `world.effects()`（client-only storage restore）接管。

### F) Routes Bucket / `window.__MODULE_ROUTES__` 依賴
- 寫入點：`platform/frontend/src/app/container/register.js:16-20`
- 事件通知：`platform/frontend/src/app/container/register.js:156`
- 讀取點（router 層）：`platform/frontend/src/router/routes.js:9`
- 讀取點（world 契約 fallback）：`platform/frontend/src/world.js:197-214`
- 讀取點（projects modules/components）：
  - `platform/frontend/projects/project-a/modules/index.js:71`
  - `platform/frontend/projects/project-b/modules/index.js:80`
  - `platform/frontend/projects/project-a/components/ProjectSidebar.vue:11`
  - `platform/frontend/projects/project-a/components/ProjectTopbar.vue:27`
  - `platform/frontend/projects/project-b/components/ProjectSidebar.vue:11`
  - `platform/frontend/projects/project-b/components/ProjectTopbar.vue:27`
- World-first 收斂路徑：**先維持 `world.getRoutesBucket()` 契約，再逐步把上述讀寫點導向 world/provider。**

### G) Entry 分流現況
- `platform/frontend/src/main.js:8,10,15`
  - 目前僅 CSR 入口：`await world.start()` 後 `createApp(...).use(world.router()).mount('#app')`。
- 掃描結果：`platform/frontend/src` 未找到 `entry-client.js` / `entry-server.js`。
- 判定：**P0（SSR 必備工作）**。

---

## 備註（World-first 裁決結論）

- 核心能力層（container/stores/api/router builder/uiRegistry）目前確實混有部分 runtime 假設；但不必用「大重寫核心」方式處理。
- 正確路徑是：**由 `world.js` 持續擴充 runtime ownership 與 pipeline 契約，並只在 SSR 必要邊界檔做最小修改，逐步把散落依賴收回到 world。**
