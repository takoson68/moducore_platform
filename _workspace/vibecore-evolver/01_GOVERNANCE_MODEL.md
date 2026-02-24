# VibeCore Evolver：治理模型（Governance Model）

## 1. 文件類型（Document Types）
- `Index`：導讀、白名單註冊、引用裁決入口
- `Boundary`：責任分配、作用域邊界、層級裁決
- `Convention`：命名、流程、實作行為規範
- `Contract`：schema、payload、adapter、介面簽名
- `Blueprint`：長期設計方向（why + architecture + phase plan）
- `Note / Report`：觀察、探索、健檢、暫存方案

## 2. Governance Gradient（治理梯度）

### 可裁決 vs 不可裁決層級
- 可裁決（通常）：`Index`、`Boundary`、`Contract`
- 候選可裁決（需看 registry/status）：`Convention`
- 非裁決（設計來源/脈絡）：`Blueprint`
- 非裁決（觀察/報告）：`Note`、`Report`

## 3. Evolver native 編碼：命名與治理身份

### 3.1 命名規格（File Naming）
- 格式：`[VisualSlot]-[GovernanceType]-[SemanticSlug].md`
- `VisualSlot`：兩位英文字母（例：`AA`, `AB`, `BA`）
- `GovernanceType`：治理身份代碼（見下表）
- `SemanticSlug`：語意 slug（小寫英數與連字號）

### 3.2 GovernanceType 合法集合與裁決表

| 代碼 | 類型 | 用途 | 是否可裁決 |
|---|---|---|---|
| `IX` | Index | 入口註冊/白名單/裁決入口 | 可裁決 |
| `WB` | Boundary | 邊界與責任分配 | 可裁決 |
| `WC` | Convention | 實作/流程慣例 | 候選（依 status/index） |
| `CT` | Contract | schema / payload / adapter 契約 | 可裁決 |
| `BP` | Blueprint | 設計藍圖與脈絡 | 不裁決 |
| `NT` | Note | 筆記/觀察 | 不裁決 |
| `RP` | Report | 報告/提案輸出/版本紀錄 | 不裁決 |

### 3.3 VisualSlot 規則（重要）
- `VisualSlot` 僅用於視覺排序與人類導覽。
- `VisualSlot` 不具治理效力。
- Evolver 在分析/裁決時必須忽略 `VisualSlot`。
- 任何合法性判斷只能依：`GovernanceType + metadata + Index Gate`。

## 4. 「可裁決內容（Gene）」定義與判定準則

### 4.1 Gene（基因）定義
- 可從母文件抽取、形成獨立治理單位的內容，例如：
  - 核心原則（例：World-first）
  - 邊界裁決（例：request-scope vs singleton）
  - schema 契約（例：SSR payload）
  - 禁止事項（例：prepare 禁止 DOM / localStorage）
  - 命名與落點規則（例：runtime provider 命名）

### 4.2 Gene 判定白名單（傾向可分裂）
- 可轉成「必須 / 不得 / 應」的規則語句
- 能對 code review 或架構審查產生裁決價值
- 可獨立被引用，不需依賴長篇背景才能理解
- 可定義驗收條件或最低檢查點

### 4.3 Gene 判定黑名單（不宜直接分裂）
- 純歷史敘事、會議脈絡、情緒描述
- 未定案的發散想法
- 需大量前文脈絡才成立的段落（宜保留在 Blueprint/Report）

## 5. Scope 裁決表（治理視角）

### 5.1 必須 request-scope（當內容涉及 runtime/SSR 並發）
- container instances（包含 store/service 實例）
- api runtime context（`projectName / headers / token / request metadata`）
- uiRegistry（`slotMap / version` 等 runtime 可變狀態）
- router instance + history state
- routesBucket（模組安裝結果、導航投影來源）

### 5.2 允許 singleton（在可證明為靜態時）
- module manifests（靜態路由宣告、meta、權限規則）
- pure helpers（純函式，如 nav projection / validator）
- compile-time config（不含 runtime 可變資料）

## 6. Index Gate 與 registry 分層（必須）

### 6.1 Index Gate（唯一入口裁決）
- 治理效力一律以對應 `index.md` 註冊為準。
- 文件存在 ≠ 可引用。
- Evolver Analyze 必須產出：
  1. `Illegal References`（指向未註冊文件）
  2. `Index Patch Proposal`（只提案，不修改 index）

### 6.2 registry 分層（active / candidate）
- `active`：正式裁決層，可作為工程依據
- `candidate`：討論/試行層，是否可引用需依 index 條文
- Evolver 應標示：candidate 被當 active 使用的治理風險

## 裁決條款

### 硬規則
- Evolver 的治理效力不得繞過 `index.md`（Index Gate）。
- `GovernanceType` 合法性必須納入分析檢查。
- `VisualSlot` 不得作為裁決依據。

### 建議
- 對治理梯度採保守策略：不確定時先降級為 Blueprint/Note 證據，而非直接升為規範。
- 分裂時優先抽取 Gene，再決定目標型別（`WB/WC/CT`）。
