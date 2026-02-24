# V2 平台 SSR-native 設計藍圖（World-first）

日期：2026-02-24  
目標：在保留平台單純性與 World-first 架構哲學下，於下一版本從底層即天然支援 SSR（而非事後補丁）

## 1. 背景與決策

### 本次原型的結論
- 現行平台可透過 Adapter / Resolver / Facade 方式達成 SSR 最小可行版本。
- 但因現行架構未預留 runtime scope / provider / pipeline staging，導致可讀性與維護成本明顯上升。
- 因此決策：**現版平台回到 OOP 單純版（保留少量有價值觀測能力，例如 `world.getContext()`），SSR 在 V2 以底層原生設計方式重做。**

### V2 設計目標（不是「補 SSR」，而是「天然多 runtime」）
- 同一套核心能力可在 CSR / SSR / Test / Embed 等不同 runtime 中運作。
- `world.js` 保持為唯一流程整合層（orchestrator）。
- 核心層保持能力純度，不承擔場景流程分流與環境判斷。

## 2. World-first 核心原則（V2 必須從 Day 1 落地）

### 2.1 Core as Capability（核心是能力，不是流程）
- Core 提供：container、store factory、ui registry、api client、router builder、services。
- Core 不直接決定：SSR/CSR、request scope、browser-only 行為、狀態還原時機。
- Core 不以 module-global mutable state 作為 runtime 真實資料來源。

### 2.2 World as Runtime Owner（World 是 runtime 所有者）
- `world.js` 持有 runtime context（`isServer/url/host/headers/initialState/projectName`）。
- `world.js` 持有 request-scope runtime 資源（container、uiRegistry、api runtime、routes bucket、router state）。
- `world.js` 負責流程順序、模式分流、adapter/provider 裝配、payload 匯出。

### 2.3 Provider-first Access（能力透過 Provider 存取）
- 不直接在業務邏輯內讀 `window/localStorage/location`。
- 不直接在任意模組讀 module-global bucket/state。
- 由 provider 介面提供能力（storage/history/fetch/routesBucket/event notifier）。

### 2.4 Pipeline Staging（流程分段）
建議標準流程：
1. `prepare(context)`：server-safe 初始化（註冊、config、router 前置、資料準備）
2. `activate()`：啟用 runtime（CSR mount / SSR app compose）
3. `effects()`：browser-only effects（storage hydrate、事件、DOM hook）

## 3. V2 架構骨架（建議）

### 3.1 Runtime Context（最小集合）
建議 `WorldContext` 欄位：
- `isServer: boolean`
- `url: string`
- `host: string`
- `headers: Record<string, string>`
- `initialState: Record<string, unknown> | null`
- `projectName: string | null`
- `apiMode?: 'mock' | 'real' | null`

### 3.2 World Adapter Contract（V2 對外契約）
- `createWorld(context, adapters?)`
- `prepare(context?)`
- `activate()`
- `effects()`
- `getContext()`
- `getRoutesBucket()` / `setRoutesBucket()`
- `exportSSRPayload()`
- `restoreState(payload)`

### 3.3 Runtime Adapters（V2 需正式化）
- `storageAdapter`: `get/set/remove`
- `historyAdapter`: `push/replace/location`
- `fetchAdapter`: request-scoped fetch
- `routeBucketProvider`: routes bucket 存取
- `eventNotifier`: `routesUpdated` / `runtimeReset` 等（SSR 可 no-op）

> 原則：Adapter 是能力來源切換，不是把流程搬進 adapter。

## 4. V2 模組與狀態邊界（避免本次原型的補丁感）

### 4.1 不再依賴 module-global mutable state 作為 runtime 真實狀態
V2 應避免以下模式成為主路徑：
- `let projectName = null`（API context）
- `let _router = null`（router holder）
- `const slotMap = new Map()`（UI registry）
- `const installedModules = new Set()`（modules 安裝狀態）
- `window.__MODULE_ROUTES__`（routes bucket）

改為：
- runtime-owned state（world instance 持有）
- 或 provider-backed state（依 request scope 解析）

### 4.2 Components / Projects 的接入原則
- Components 不直接讀 `window.__MODULE_ROUTES__`。
- Components 不直接做 SSR/CSR 模式判斷（除非純 UI fallback）。
- 透過 `world` 或注入 service 取得 routes bucket/nav projection。
- project modules 的 install state 應與 runtime scope 綁定，而非 process-global。

## 5. V2 目錄與責任建議（World-first + SSR-native）

### 5.1 建議責任分層
- `src/world/`：World runtime owner、pipeline、context、payload
- `src/runtime/`：adapters/providers（storage/history/fetch/routes/events）
- `src/app/*`：核心能力實作（不含場景流程）
- `src/entry-client.ts/js`、`src/entry-server.ts/js`：模式入口
- `projects/*`：業務模組與 UI，透過 world/service 接入平台能力

### 5.2 V2 是否還保留 `world.js`
- 可以保留 `world.js` 作為 façade（匯出 `createWorld`、default singleton、active runtime helpers）
- 但內部實作建議分拆到 `src/world/*`，降低單檔密度

## 6. V2 遷移策略（從現版 OOP 平台出發）

### Phase 0：規格先行（不急著改碼）
- 定義 `WorldContext` 與 `World Adapter Contract`
- 定義 adapters/providers 介面型別
- 定義「哪些狀態不得 module-global」清單

### Phase 1：核心能力 provider 化（不改行為）
- container / uiRegistry / api runtime / router holder 提供 `create*()` 與 provider 入口
- 維持 CSR 預設 singleton 行為不變

### Phase 2：World runtime owner 落地
- `createWorld(context, adapters)` 成為主入口
- world pipeline 正式接管 prepare/activate/effects
- `entry-client` / `entry-server` 走同一 world contract

### Phase 3：Projects 接入路徑收斂
- routes bucket/nav projection 不再讀 `window`
- modules 安裝狀態與 runtime scope 綁定
- SSR/CSR 共享同一份接入契約

## 7. V2 驗收清單（設計完成時應成立）

### 7.1 架構驗收
- 新增 runtime 模式時，主要變更集中於 world + 少數 entry/provider 檔案。
- Core 檔案不承擔場景流程分支。
- Components 不直接讀 browser globals 作為資料來源。

### 7.2 技術驗收
- SSR import 不炸（module-load 階段無 browser globals）
- SSR render 可併發（request-scope world/container/uiRegistry/api/router）
- CSR 行為不退化（啟動流程/路由/模組/UI slot 與原體驗一致）
- `ssrPayload` 可序列化並可還原（hydrate baseline）

### 7.3 維護驗收
- 新人可在 30 分鐘內理解 runtime flow（world pipeline）
- provider / adapter 命名一致、入口固定
- 不需在多層搜尋散落的 `typeof window !== 'undefined'` 來理解系統行為

## 8. 本次原型帶來的有效資產（可保留到現版）

建議在現版保留（低風險、高價值）：
- `world.getContext()`（觀測 / 診斷 / 測試）
- World-first 的規範文件（Boundary / Convention）
- SSR 健檢報告與設計報告（作為 V2 規劃依據）

建議不要在現版繼續堆疊：
- 為了相容而加入更多跨層 resolver / proxy / dual-path hack
- 在多處補 SSR 判斷而沒有先定義 provider/contract

## 9. 一句話定義 V2 方向

- **V2 不是「把 CSR 平台改成 SSR」，而是「從一開始就以 World-first 的多 runtime 平台設計」。**
