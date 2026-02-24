# Boundary
本文件宣告平台在「整合責任分配」上的邊界，
用於約束核心能力層、World 整合層與 UI/Project 接入層之間的責任。

Title: World-First Integration  
Status: active  
Scope: platform  

---

## 核心主張

- 核心層（Core / Container / Stores / Registry / API 能力）應視為可重用資源。
- `world.js` 應作為流程整合介面（orchestrator / adapter）。
- 流程、模式、上下文差異應由 `world.js` 收斂與編排。

一句話版本：

> Core 提供能力，World 決定何時、如何、在何種 context 下使用能力。

---

## 目的

- 避免新增需求（如 SSR、測試模式、嵌入模式）時改動分散到核心各層。
- 降低「修東牆補西牆」式維護風險。
- 保留平台架構哲學與專案個性，不被通用範例主導。

---

## 邊界分層

### 1. Core / 能力資源層邊界

- 提供能力（stores、container、services、api client、registry）。
- 不承擔場景流程（SSR / CSR / test / embed）的編排責任。
- 不應主動擴散模式判斷邏輯。
- 不應直接以 browser globals（如 `window` / `document` / `location` / `localStorage`）作為跨模式共通契約。
- 不得自行推斷 runtime 模式（server/client），不得以 scattered flags 作為架構核心判斷依據。

---

### 2. World / 流程整合層邊界

- 統一初始化順序與依賴裝配。
- 處理 runtime context（例如 server/client、url、host、initialState）。
- 管理模式分流（CSR / SSR / hydrate / test / embed）。
- 對外提供穩定整合介面，避免上層直接碰核心細節。

#### 2.1 Runtime Ownership（Runtime 唯一所有權）

- Runtime Context（server/client/url/host/initialState 等）由 World 唯一持有與分發。
- Core 若需要 runtime 資訊，必須由 World 注入或傳入。
- Core 不得直接讀取 browser globals 作為模式決策來源。
- 模式分流必須集中於 World，而非散落於多層檔案。

#### 2.2 Pipeline Staging（可分段啟動管線）

World 必須提供可分段的啟動管線，至少包含：

- `prepare(context)`  
  - 建立與組裝 runtime  
  - 不執行 browser-only 副作用  
  - 必須可在無 `window` / `document` / `localStorage` 環境執行  

- `activate()`  
  - 僅負責 client 端 hydrate 或 mount  

- `effects()`  
  - 僅處理 browser-only 副作用（storage、事件、監測、DOM 行為）  

World 的流程必須可被重建與重放，以支撐不同 runtime 模式。

#### 2.3 與實作契約的映射（避免命名分歧）

- 本文件中的 `prepare / activate / effects` 為 **邊界層的分段概念**，用於描述責任切分。
- 實作層可使用不同命名（例如 `clientBoot / exportState / restoreState`），但必須能清楚映射回本邊界定義。
- 若實作命名與本文件不同，應在對應規格文件（如 SSR-ready checklist / adapter contract）明確列出對照表。
- 不得因命名差異而改變責任歸屬（例如將 browser-only 副作用回流到 Core）。

---

### 3. UI / Project 接入層邊界

- 優先透過 `world` 取得能力或衍生資料。
- 避免直接依賴不受 `world` 管控的全域暫存。
- 避免將模式分流判斷散落於元件內。
- 不得以 `window.*` 作為唯一資料來源。

---

## 設計判準

- 先判斷是「能力問題」還是「流程問題」：
  - 能力問題：調整核心
  - 流程問題：優先放在 `world.js`
- 新需求應先在 World Adapter 收斂介面，再評估是否需要下沉修改核心。
- 新增運行模式時，優先擴充 `world.js`，而不是重寫核心初始化語意。
- 先收斂再下沉：先統一依賴來源與決策路徑，再討論能力調整。

---

## 禁止事項

- 禁止將 SSR / CSR 模式流程分支散落至多個核心檔案作為第一選項。
- 禁止上層直接繞過 `world.js` 操作核心資源（除非已有明確規範允許）。
- 禁止在未定義 World Adapter 契約前，大量改寫核心初始化流程。
- 禁止為單一模式（如 SSR）重寫核心語意，除非證明核心能力不足。
- 禁止以臨時補丁方式在各層加入零散模式判斷，取代 World 統一編排。

---

## 驗收方向（邊界是否被遵守）

- 新增運行模式時，主要改動集中於 `world.js` 與少數邊界檔案。
- Core 檔案不被迫承擔場景流程判斷。
- Code review 可清楚區分「能力變更」與「流程變更」。
- Runtime Context 由 World 收斂，而非由多層自行推斷。
- 可驗證：在無 `window` 的 Node 環境執行 `prepare(context)` 不應拋出 browser globals 相關錯誤。
