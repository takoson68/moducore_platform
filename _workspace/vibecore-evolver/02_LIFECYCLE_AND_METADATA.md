# VibeCore Evolver：生命週期與 Metadata 規格

## 1. 狀態機（Lifecycle State Machine）

### 1.1 狀態定義
- `draft`：初稿，尚未完成內容結構或驗收條件
- `candidate`：已有基本可讀性與裁決雛形，可討論/試引用
- `approved`：已通過人工裁決，等待正式註冊
- `active`：正式有效，可作為工程裁決依據
- `deprecated`：不建議新引用，但需保留遷移策略
- `archived`：歷史保存，不作為當前裁決依據

### 1.2 狀態轉移規則（建議）
- `draft -> candidate`：內容完整、metadata 齊備、具初步驗收條件
- `candidate -> approved`：人工審核通過
- `approved -> active`：已在 `index.md` 正式註冊
- `active -> deprecated`：已有替代文件或內容不適用
- `deprecated -> archived`：引用已清理或保留策略固定

### 1.3 非法或不建議轉移
- `draft -> active`
- `candidate -> archived`（未交代理由）
- `deprecated -> active`（未重新審核）

## 2. Metadata 標準（YAML frontmatter 建議格式）

### 2.1 建議欄位（基礎）
- `id`（永久 ID，不因檔名變動）
- `title`
- `type`（治理身份代碼：`IX/WB/WC/CT/BP/NT/RP`）
- `status`
- `scope`
- `owner`
- `last_reviewed`
- `supersedes`
- `related`
- `derived_from`

### 2.2 建議欄位（命名與導覽）
- `visual_slot`（可變、可省略，僅作導覽）
- `semantic_slug`（建議保留，便於命名檢查）

### 2.3 不變性規則（重要）
- `id`：應視為永久識別碼，不因檔名改變而改變
- `type`（治理身份）：不應隨意改變；若改變代表文件治理身份重定義，應走 proposal 與審核
- `visual_slot`：可調整（為視覺排序服務），不影響治理效力

### 2.4 YAML frontmatter 範例
```yaml
---
id: EVO-BP-0001
title: V2 平台 SSR-native 設計藍圖（World-first）
type: BP
status: draft
scope: platform
owner: architecture
last_reviewed: 2026-02-24
visual_slot: AA
semantic_slug: v2-ssr-native-blueprint
supersedes: []
related:
  - boundaries/B003_world_first_integration.md
  - conventions/C007_pipeline_staging_rules.md
derived_from: []
---
```

## 3. Index Gate 與 registry 分層（必須）

### 3.1 Index Gate（存在 ≠ 可引用）
- 文件存在於檔案系統，不代表具治理效力。
- 只有被對應 `index.md` 註冊的文件，才可被引用為裁決/證據。
- Evolver Analyze 的責任：
  - 找出未註冊引用（Illegal References）
  - 提出 `Index Patch Proposals`
- Evolver Analyze 的限制：
  - 不得直接改 `index.md`
  - 不得在報告中宣告未註冊文件為 active 事實

### 3.2 registry 分層（active / candidate）
- `active registry`：正式裁決層
- `candidate registry`：討論/試運行層
- Evolver Analyze 應報告：
  - candidate 被誤用為 active 的引用鏈
  - deprecated 文件仍被新規範引用的情況

## 4. Index Patch Proposal 原則（Analyze-only）
- Evolver 可提出 `Index Patch Proposals`，包含：
  - `add`
  - `move`
  - `deprecate`
- 本版禁止：
  - 實際修改 `index.md`
  - 自動重寫任何導讀條目

## 裁決條款

### 硬規則
- 狀態機不得跳過必要審核步驟直接提升為 `active`。
- `index.md` 是唯一入口裁決（Index Gate）。
- `VisualSlot` 可調整，但 `id/type` 不可被視為導覽欄位。

### 建議
- 優先補齊 metadata 再做大規模 split/move 提案。
- 將 `id/type/visual_slot` 明確分工：識別、治理、導覽。
