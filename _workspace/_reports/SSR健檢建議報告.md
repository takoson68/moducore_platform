# ModuCore Platform 前端 SSR 健檢建議報告

日期：2026-02-24
範圍：`platform/frontend`（含 `platform/frontend/projects/*`）
目的：評估現行架構導入 SSR 的可行性、風險與建議改造順序

## 結論摘要

- 可做 SSR，但目前尚未達到可直接導入狀態。
- 難度屬於中等，主要成本在處理全域單例與 browser-only 依賴。
- `world.start()` 的集中初始化設計是優勢，適合成為 SSR 編排核心。
- 若目標是「盡量不改底層核心」，可以把大部分複雜度收斂在 `world.js` + entry/router 邊界，但仍需少量配合修改。

## 就緒度評估

- SSR 就緒度：3/10（可提升）
- 難度：中等
- 主要風險：
  - 跨 request 狀態污染
  - server render 時直接碰 `window` / `localStorage`
  - router 歷史模式不支援 SSR

## 主要阻礙（高優先）

### 1. `World` 為模組單例，會造成 SSR 跨 request 污染

- 檔案：`platform/frontend/src/world.js`
- 現況：`export default new World()`
- 風險：Node SSR server 常駐時，多個 request 共用同一個 world 實例與狀態

建議：
- 改成 `createWorld()` 工廠（保留 `World` 類別與 `start()` 流程概念）
- 每個 SSR request 建立一個 world instance

### 2. Container / Router holder / UI registry 為全域單例

- `platform/frontend/src/app/container/container.js`
- `platform/frontend/src/router/holder.js`
- `platform/frontend/src/app/uiRegistry.js`

風險：
- store instance、router、UI slots 在請求間共享
- 容易出現資料殘留、重複註冊、行為不一致

建議：
- 將這些狀態改為 world-scoped 或 request-scoped
- 至少讓 `world.js` 可持有自己的容器/registry 實例

### 3. Router 固定 `createWebHistory()`，SSR 無法直接使用

- 檔案：`platform/frontend/src/router/index.js`

建議：
- server 使用 `createMemoryHistory()`
- client 使用 `createWebHistory()`
- 在 server render 前先 `router.push(url)` 並等待 `router.isReady()`

## Browser 依賴風險（SSR 常見炸點）

### 4. 路由註冊流程直接使用 `window`

- 檔案：`platform/frontend/src/app/container/register.js`
- 現況：
  - 直接寫 `window.__MODULE_ROUTES__`
  - `window.dispatchEvent(new CustomEvent(...))`

影響：
- SSR boot 過程若呼叫 `register.routes()`，server 端會直接報錯

建議：
- 將 route bucket 從 `window` 搬到 world/context 內
- `dispatchEvent` 改為 client-only 或抽象成事件介面

### 5. Store factory 初始化階段直接讀寫 `localStorage`

- 檔案：`platform/frontend/src/app/stores/_storeFactory.js`
- 現況：建立 store 後立即 `loadFromStorage()`

影響：
- SSR 建 store 時可能觸發 browser-only 行為
- 即使 try/catch 吃掉錯誤，也會增加 hydration mismatch 風險

建議：
- `loadFromStorage()` 延後到 client 初始化流程執行
- SSR 初始化僅使用預設值或 server 注入的 state

### 6. API mode 判斷直接使用 `window.location`

- 檔案：`platform/frontend/src/app/api/apiMode.js`

建議：
- 接收 `runtime context`（host/isServer）
- server 端依 request host 決定 mode，而不是讀 `window`

## 專案層（`projects/*`）SSR 風險

### 7. Project modules registry 有全域快取與安裝集合

- 檔案：
  - `platform/frontend/projects/project-a/modules/index.js`
  - `platform/frontend/projects/project-b/modules/index.js`
- 現況：
  - `loadedModules`（Map）
  - `installedModules`（Set）
  - 模組級共享

影響：
- SSR 請求間可能跳過安裝流程
- 導致 routes/ui/stores 不完整或引用舊狀態

建議：
- 將「是否已安裝」狀態移到 world/request scope
- 模組載入快取可保留，但安裝狀態不可全域共用

### 8. 多個 project 組件在 render/computed 直接讀 `window.__MODULE_ROUTES__`

- 例如：
  - `platform/frontend/projects/project-a/components/ProjectSidebar.vue`
  - `platform/frontend/projects/project-a/components/ProjectTopbar.vue`
  - `platform/frontend/projects/project-b/components/ProjectSidebar.vue`
  - `platform/frontend/projects/project-b/components/ProjectTopbar.vue`

影響：
- SSR 渲染模板時可能執行 computed，直接碰 `window` 導致失敗

建議：
- 改由 `world` 或注入服務提供 route bucket / nav projection 資料
- 組件不直接讀 `window`

## 目前架構的優勢（適合 SSR 的點）

- `world.start()` 已集中初始化順序（很適合做 SSR 編排入口）
- `boot()` 有部分 browser guard（例如 reset hook）
- router 建立已封裝成函式（便於切換 memory/web history）
- 專案配置載入 (`import.meta.glob`) 在 Vite SSR 模式可延用

## 建議改造策略（符合你「盡量不動核心」的方向）

### 核心原則

- 保留 `World` 作為 OOP facade / orchestration layer
- 把 SSR 複雜度盡量集中在 `world.js`
- 底層核心邏輯盡量不改，只調整少數邊界點

### `world.js` 建議角色（SSR 適配層）

- 分流 server/client 初始化流程
- 接收 runtime context（`isServer`, `url`, `headers`, `projectName`）
- 統一建立 router/container/api
- 管理 hydration state 匯出/還原
- 延後 browser-only 行為到 client 階段

## 建議改造順序（分階段）

### Phase 1：先打通 SSR 骨架（最低可行）

1. 新增 `entry-client` / `entry-server`
2. router 支援 `memory/web` history 切換
3. `World` 改為 factory（每 request 一份 instance）

目標：
- 能完成 server render + client hydrate 的基本流程

### Phase 2：清理全域共享狀態

1. container 改 request-scoped / world-scoped
2. router holder 去全域化（或綁定 world instance）
3. ui registry 去全域化
4. modules 安裝狀態改 request-scoped

目標：
- 避免跨 request 污染

### Phase 3：清理 browser-only 依賴

1. route bucket 不再依賴 `window.__MODULE_ROUTES__`
2. `localStorage` 載入移至 client-only
3. `apiMode` 使用 context/host 判定
4. project 組件改用 world/service 注入資料

目標：
- server render 穩定運作，不因 `window/document` 崩潰

### Phase 4：完善 SSR 體驗

1. route-level / module-level data prefetch
2. state serialize / hydrate restore
3. 錯誤邊界與 fallback 頁面
4. SSR/CSR 一致性測試

目標：
- SSR 不只是外殼，而是有內容、可穩定維護

## 你目前最值得先做的 3 件事

1. 定義 `World` 的 SSR 適配責任（server/client/request context）
2. 決定 route bucket 不再依賴 `window` 的新存放位置（world 或 registry）
3. 確認哪些全域單例要改成 request-scoped（至少 container/router/uiRegistry）

## 建議的後續產出（如果要進一步規劃）

- `SSR 改造藍圖`（檔案清單 + 方法介面）
- `風險拆解表`（每項改動的影響範圍）
- `分階段實作清單`（可逐步 merge）
- `驗收清單`（SSR 首屏、hydrate、導航、登入狀態、模組註冊）

---

備註：
- 本報告基於目前掃描到的 `platform/frontend` 與 `platform/frontend/projects/*` 結構。
- 尚未進行任何程式修改。

