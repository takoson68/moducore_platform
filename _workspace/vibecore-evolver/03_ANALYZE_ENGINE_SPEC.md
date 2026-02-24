# VibeCore Evolver：Analyze Engine 規格（Analyze-only）

## 1. 範圍與模式
- 本規格定義 `Scanner` 與 `Analyzer` 的 Analyze-only 行為。
- 本版不實作任何改檔、搬遷、連結重寫、索引更新。

## 2. 掃描與分析流程（固定順序）
- `Naming Compliance Check` → `Index Gate Check` → `Illegal References` → `Proposals`
- 此順序為硬規則，避免尚未確定身份與合法性就先產生治理提案。

## 3. Scanner 規格（掃描器）

### 3.1 掃描輸入
- 目標根目錄（例：`_VibeCore/`）
- include/exclude paths
- file types（預設 `*.md`）
- 掃描上限（防止一次掃太大）

### 3.2 掃描輸出（原始觀測資料）
- `fileInventory`
- `metadataInventory`
- `referenceGraph`
- `indexRegistryMap`
- `namingInventory`
- `contentSignals`

### 3.3 必掃項目
- 檔案清單與 metadata 完整度
- 引用圖（Markdown link / 行內 Path / Evidence）
- 未註冊引用（Index Gate）
- 過長文件、混層內容
- 命名 pattern 與 GovernanceType 合法性

## 4. Naming Compliance Check（新增）

### 4.1 檢查內容
- 命名是否符合 pattern：`[A-Z]{2}-(IX|WB|WC|CT|BP|NT|RP)-[a-z0-9-]+\\.md`
- `GovernanceType` 是否在合法集合內
- `VisualSlot` 是否僅作導覽（分析時忽略）

### 4.2 分析裁決原則
- 命名不合規 ≠ 自動非法引用
- 命名合規 ≠ 自動具治理效力
- 合法性仍需經過 `metadata + Index Gate`

### 4.3 VisualSlot 忽略規則（必須）
- Scanner 可記錄 `VisualSlot`
- Analyzer 在治理判定時必須忽略 `VisualSlot`
- 報告中可顯示 `VisualSlot` 作為導覽資訊，但不得作為風險分數依據

## 5. Index Gate Check 與 Illegal References
- `Index Gate Check`：判定文件是否被對應 `index.md` 註冊
- `Illegal References`：列出指向未註冊文件的引用（來源檔、目標檔、連結類型）
- Analyze 模式必須產出：
  - `Illegal References Report`
  - `Index Patch Proposals`

## 6. Analyzer 規格（分析器）

### 6.1 輸出（proposal 與報告）
- `Evolution Proposals`
  - `split / move / merge / deprecate / promote`
- `Index Patch Proposals`
- 風險與影響範圍

### 6.2 Proposal 類型判定（建議）
- `split`：母文件過長、混層、Gene 明顯存在
- `move`：位置不符治理層級
- `merge`：重複主題規範並存
- `deprecate`：被取代或不適用
- `promote`：candidate 經驗證具穩定裁決價值

## 7. 診斷分數（可選）
- `GovernanceClarity`
- `ContextCoupling`
- `EvolutionPressure`

## 8. 明確不做（本版硬限制）
- 不自動改檔
- 不自動更新 `index.md`
- 不自動 rewrite links
- 不自動變更 `Status`

## 裁決條款

### 硬規則
- Analyze Engine 不得執行任何檔案內容變更。
- 流程順序固定：`Naming -> Index Gate -> Illegal Refs -> Proposals`。
- 必須產出 `Illegal References Report` 與 `Index Patch Proposals`。
- 分析判定必須忽略 `VisualSlot`。

### 建議
- 診斷分數先作排序與討論輔助，不作唯一裁決依據。
- 初期以單主題分析驗證規則品質，再擴大範圍。
