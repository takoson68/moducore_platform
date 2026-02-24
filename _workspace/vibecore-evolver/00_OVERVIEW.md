# VibeCore Evolver（討論用）總覽

## 一句話版本
- `VibeCore Evolver` 是一個外部治理工具/skill，用於 **Analyze-only** 地掃描、評估、提出 `_VibeCore/` 的知識分裂（Cell Division）、搬遷、合併與淘汰提案；本版不執行任何實際變更。

## 目標
- 建立 `_VibeCore/` 的外部治理與演化分析規格，避免手動整理時「脫皮不乾淨」。
- 將 `_VibeCore/` 視為宣告式知識本體（Declarative），由 Evolver 在外部提供轉換提案（Transform Proposals）。
- 提供可追蹤、可版本化、可回退的 Analyze-only 提案格式。

## 非目標
- 不實作工具、不實作 skill 程式碼。
- 不修改 `_VibeCore/` 任一既有檔案（包含 `index.md`、任何連結、任何內容）。
- 不做自動搬遷、不做自動重寫連結、不做自動升級 `Status`。
- 不取代 `index.md` 的治理裁決權。

## 核心邊界（Evolver 不取代 Index 裁決）
- Evolver 的角色：`Scan -> Analyze -> Propose`
- `_VibeCore/.../index.md` 的角色：`Register -> Whitelist -> Adjudicate`
- Evolver 可以提出：
  - `Illegal References Report`
  - `Index Patch Proposals`
- Evolver 不可以：
  - 直接修改 `index.md`
  - 直接宣布某文件成為有效規範

## Analyze vs Apply 模式定義

### Analyze 模式（本版唯一模式）
- 只讀掃描目標目錄與引用關係。
- 產出分析報告與 proposal JSON。
- 提出 `index.md` 更新建議，但不實際修改。
- 預設且強制模式。

### Apply 模式（未來版本，僅定義）
- 根據核准 proposal 執行檔案操作（split/move/merge/deprecate/promote）。
- 本版不實作。
- 若未來實作，固定順序必須為：
  1. 先產出並核准 `Index Patch Proposal`
  2. 先更新 `index.md`
  3. 再修正文內引用與證據鏈

## 與 `_VibeCore/` 的關係：Declarative vs Transform
- `_VibeCore/`：知識本體、規範內容、設計哲學（Declarative）
- `VibeCore Evolver`：掃描與演化提案機制（Transform / Governance Tooling）
- 關係原則：
  - Evolver 可分析 `_VibeCore/`
  - Evolver 不內嵌於 `_VibeCore/`
  - `_VibeCore/` 不承擔自我進化邏輯

## Evolver native 編碼（VisualSlot + GovernanceType）

### 核心定義
- Evolver 採用「兩位字母 `VisualSlot` + `GovernanceType`」作為 native 編碼語言。
- 此編碼不只用於文件命名，也用於 Evolver 的報告、提案、版本紀錄輸出格式。

### 文件命名（File Naming）
- 格式：`[VisualSlot]-[GovernanceType]-[SemanticSlug].md`
- 範例：
  - `AA-WB-runtime-scope.md`
  - `AB-WC-naming-rule.md`
  - `BA-CT-ssr-context.md`

### Evolver 輸出命名（Analyze-only）
- 報告（Report）：`[VisualSlot]-RP-*.md`
- 提案（Proposal）：`[VisualSlot]-RP-proposal-<EID>.md`（或 `.json`）
- 版本紀錄（Evolution Log）：`[VisualSlot]-RP-evolution-log.md`
- `EID` 格式固定：`E001`, `E002` ...（操作追蹤用，不作閱讀順序）

### 規則語意
- `VisualSlot`：只做視覺排序與人類導覽，不具治理效力。
- `GovernanceType`：代表治理身份（如 `WB/WC/CT/...`），用於分類與合法性判定。
- Evolver 在分析/裁決時必須忽略 `VisualSlot`，只能依 `GovernanceType + metadata + Index Gate` 判定。

## 裁決條款

### 硬規則
- 本版文件僅定義 Analyze-only 規格。
- Evolver 不得取代 `index.md` 的裁決權（Index Gate）。
- 文件存在不代表可引用；是否可引用一律以對應 `index.md` 註冊為準。
- Evolver 所有輸出（報告/提案/版本紀錄）必須遵守 native 編碼規則。

### 建議
- 先以單一主題（如 V2 藍圖拆規範）驗證分析輸出品質，再擴大掃描範圍。
- 將 Evolver 的輸出視為「治理提案」，交由人工裁決與 code review 式審閱。
