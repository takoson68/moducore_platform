# `world.js` World-First 架構健檢報告

日期：2026-02-24  
範圍：`platform/frontend/src/world.js`  
依據規範：
- `_VibeCore/new_engineering/boundaries/B003_world_first_integration.md`
- `_workspace/_reports/SSR_READY_CHECKLIST.md`

## 1. 結論（先講結果）

- `platform/frontend/src/world.js` **方向正確**：已具備 World 作為整合入口的雛形。
- 目前主要問題不是「world 不存在」，而是 **World 的所有權還不夠完整**：
  - runtime context 尚未由 World 收斂
  - world 仍大量依賴外部全域單例/全域 holder
  - 啟動流程只有單段 `start()`，尚未分段（`prepare / activate / effects`）
- 若要符合 `B003` 並為 SSR-ready 預留空間，**建議優先擴充 world.js 的責任與介面**，而不是先拆核心。

## 2. 目前符合 B003 的地方（可保留）

### 2.1 World 作為整合入口（符合）

- `platform/frontend/src/world.js` 已集中整合：
  - stores 註冊
  - project config 載入
  - API 初始化
  - boot
  - router 建立
- 這符合 `B003` 的「World / 流程整合層邊界」。

### 2.2 初始化順序集中管理（符合）

- `start()` 內的流程順序明確，且以 Promise 避免重入。
- 這符合你希望的「流程所有權在 World」。

### 2.3 上層呼叫介面簡化（符合）

- `http() / authApi() / store() / service() / router()` 等 façade 方法已存在。
- 這是正確方向：上層應優先透過 World 取得能力，而不是直接碰核心。

## 3. 與 B003 的主要落差（World-first 視角）

### 3.1 Runtime Context 未被 World 持有（關鍵落差）

`B003` 要求：
- Runtime Context（server/client/url/host/initialState）由 World 唯一持有與分發

目前 `world.js` 狀態：
- `start()` 不接受 `context`
- `projectName` 仍由 `import.meta.env` 與 `projectConfig` 在流程內直接決定
- `apiMode()` 直接呼叫 `getApiMode()`（實際依賴 `window.location`）

影響：
- World 尚未成為 runtime context 的唯一所有者
- 後續 SSR / test / embed 模式會被迫把分流邏輯散落到別處

### 3.2 World 仍依賴多個「全域共享狀態」（所有權不完整）

目前 `world.js` 直接依賴：
- `registerStore / resolveStore / resolveService / listRegistry`（背後是全域 container）
- `registerUISlot`（背後是全域 ui registry）
- `setRouter(router)`（全域 router holder）
- `http` / `authApi` / `initApi`（API 模組級狀態）

World 問題不是「有沒有整合」，而是：
- **整合的是全域單例，而不是 world-owned runtime**

這會讓 `world.js` 很像 orchestrator，但還不是完整的 runtime owner。

### 3.3 啟動流程只有 `start()`，未分段（不利模式擴充）

`B003` 建議的分段概念：
- `prepare(context)`
- `activate()`
- `effects()`

目前：
- `start()` 同時做了 runtime 組裝 + router 建立 +（未來很可能還會加入更多副作用）

風險：
- 後續要支援 SSR / hydrate 時，容易把條件判斷塞進 `start()`
- 最後形成大型 if/else，而不是清楚的分段管線

### 3.4 World 對依賴來源收斂還不夠（與 SSR-ready 清單未對齊）

`SSR_READY_CHECKLIST` 已提出 World 應收斂的 getter 契約：
- `getRoutesBucket()`
- `getApiMode()`
- `getInitialState()`

目前 `world.js` 尚未承接這些責任。

結果：
- routes bucket 仍散落在 `window.__MODULE_ROUTES__`
- api mode 仍是 browser 來源
- initial state 尚未成為 World 契約的一部分

## 4. `world.js` 的修改建議（不改碼，依 World-first）

以下建議以「改動集中在 `world.js`」為原則，先擴充 World Adapter，再決定是否下沉到核心。

### 建議 A：把 `start()` 升級成分段管線（保留相容入口）

目標：
- 保留現有 `world.start()` 對上層的使用習慣
- 內部改為可分段的 World pipeline

建議方向：
- `start()` 變成相容入口（wrapper）
  - 內部依序呼叫 `prepare(context?) -> activate() -> effects()`
- 初期可先讓 `activate()` / `effects()` 為空或薄包裝，不要一次重構完

好處：
- 不破壞現有使用方式
- 符合 `B003` 分段啟動邊界
- 為 SSR-ready 契約預留空間

### 建議 B：在 World 引入 Runtime Context 所有權（最低集合）

目標：
- 讓 World 成為 runtime context 唯一入口與分發者

建議 World 內部至少持有：
- `isServer`
- `url`
- `host`
- `headers`
- `initialState`
- `projectName`

建議方式（概念層）：
- `world.start(context)` 或 `world.prepare(context)` 接收 context
- 未提供時由 CSR 預設值補齊（相容現有 `main.js`）

注意（符合你的哲學）：
- 這不是把核心改成 SSR-aware
- 是讓 World 管 context，核心只接受被注入的結果

### 建議 C：World 增加「依賴來源收斂 getter」作為過渡層

目標：
- 先把依賴入口集中到 World
- 不急著一次改掉所有底層實作

建議優先新增（概念）：
- `world.getApiMode()`
- `world.getRoutesBucket()`
- `world.getInitialState()`

用途：
- 後續逐步替換散落在 UI / modules / API mode 的直接來源
- 先建立 World 契約，再做實際引用點遷移

這一步很符合你要的「先有靈魂，再談落地細節」。

### 建議 D：World 對全域資源建立「owned handles」觀念（不一定立刻改核心）

目前：
- World 是 façade，但依賴全域單例

建議：
- 在 `world.js` 內先建立「世界持有的 handles」概念（即使初期仍指向全域）
  - router handle
  - api handle
  - registry handle
  - ui handle

目的：
- 讓後續從全域單例遷移到 world-scoped 時，不用改上層呼叫習慣

### 建議 E：World 對外介面命名與 B003 / SSR checklist 對齊

目前文件已有兩套名稱：
- `B003`：`prepare / activate / effects`
- SSR checklist：`prepare / clientBoot / exportState / restoreState`

建議做法：
- 在 `world.js` 採雙層命名策略（概念與實作可映射）
- 至少在註解與文件中固定對照，不讓命名漂移

建議對照（概念）：
- `prepare(context)` -> runtime 組裝（server/client 共用）
- `clientBoot()` -> `activate()` 的 client 實作命名
- `effects()` -> browser-only 副作用階段
- `exportState()/restoreState()` -> 支撐分段管線與跨 runtime 交接

## 5. 不建議的改法（依 B003 禁止事項）

### 5.1 不建議先把 SSR/CSR 判斷散落到各核心檔案

例如先去大量修改：
- container
- store factory
- api mode
- router holder

原因：
- 會讓模式邏輯散落，違反 `B003` 的 World-first 原則

### 5.2 不建議先把 `world.js` 改成大型 if/else SSR 開關

如果直接把 `start()` 塞滿：
- `if (isServer) ... else ...`
- 再混入 hydrate、effects、storage 條件

結果通常是：
- 看似集中，實際上責任混雜
- 很快失去可維護性

應先做：
- 分段（prepare/activate/effects）
- 再做模式分流

### 5.3 不建議為了 SSR-ready 讓 CSR 多跑一次初始化

這點你已經定義得很清楚，值得保留：
- `world.start()` 不應因預留 SSR 而造成雙重 bootstrap

## 6. 建議的「最小變更路徑」（world.js 優先）

### Phase W1（只改 world.js 介面與結構，不動核心實作）

- 在 `world.js` 內定義分段管線骨架（`prepare / activate / effects`）
- 保留 `start()` 作為相容入口
- 引入 `context`（可選參數，CSR 預設值）
- 補齊 World 對 runtime context 的內部欄位

### Phase W2（world.js 新增收斂 getter，不急著全面替換使用點）

- 加入 `getApiMode / getRoutesBucket / getInitialState`
- 將 `apiMode()` 改為透過 World 自己的 mode 決策入口（概念層先行）
- 在文件中建立命名映射（對齊 `B003` 與 SSR checklist）

### Phase W3（再逐步替換外部依賴點）

- UI / project components 的 routes bucket 來源逐步改為 world 契約
- API mode 來源逐步改為 world/context
- Store 初始狀態來源逐步改為 world initial state 契約

這樣可以符合你的要求：
- 核心維持資源層定位
- World 成為整合層與模式所有權中心
- 改動不會一開始就散到全平台

## 7. 對 `world.js` 的總評（依你的哲學）

- 目前 `world.js` 已經有「World-first」的骨架
- 你不是要推翻它，而是要讓它完成「所有權升級」
- 最值得做的不是先拆核心，而是：
  - 讓 World 持有 context
  - 讓 World 分段啟動
  - 讓 World 收斂依賴來源

一句話總結：
- **`world.js` 現在像是整合入口；下一步要把它升級成真正的 Runtime Owner。**

