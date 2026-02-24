# VibeCore Evolver：MVP Runbook（Analyze-only）

## 1. 目的
- 定義 Evolver 的最小可用流程（MVP），僅限 Analyze-only：`input -> scan -> analyze -> report`
- 本文件用於後續和 ChatGPT / Codex 討論 skill 設計與實作分工。

## 2. 最小可用流程（Analyze-only）
1. 讀取輸入設定（JSON）
2. 執行 Naming Compliance Check
3. 執行 Index Gate Check
4. 產出 Illegal References
5. 產出 Proposals（split/move/merge/deprecate/promote）
6. 產出報告與 JSON 檔案

## 3. 輸入格式（JSON）

### `analyze-input.json` 範例
```json
{
  "mode": "analyze",
  "targetRoot": "_VibeCore",
  "includePaths": ["_VibeCore/new_engineering"],
  "excludePaths": ["_VibeCore/world"],
  "fileTypes": [".md"],
  "topic": "V2 SSR-native blueprint governance split",
  "limits": {
    "maxFiles": 300,
    "maxSplitProposals": 3
  },
  "scoring": {
    "enable": true
  }
}
```

## 4. 輸出格式（Markdown + JSON）

### 4.1 Evolver native 輸出命名規則（RP）
- 報告（Report）：`[VisualSlot]-RP-*.md`
- 提案（Proposal）：`[VisualSlot]-RP-proposal-<EID>.md` 或 `.json`
- 版本紀錄（Evolution Log）：`[VisualSlot]-RP-evolution-log.md`
- `EID`：`E001`, `E002` ...（操作追蹤用）

### 4.2 一個完整的 analyze-only 產出清單（示例）
- `AA-RP-analyze-summary.md`
- `AB-RP-proposal-E001.json`
- `AC-RP-proposal-E002.md`
- `AD-RP-illegal-references.json`
- `AE-RP-index-patch-proposals.json`
- `AF-RP-evolution-log.md`

### 4.3 `report.md` 建議章節
- 結論摘要
- 掃描範圍與統計
- Naming Compliance Check（必須）
- Illegal References Report（必須）
- Index Patch Proposals（必須）
- Evolution Proposals
- 風險與建議順序

## 5. 防呆條款（MVP 必須）
- 預設 `mode = analyze`
- 一次只處理一個主題（`topic` 必填）
- 一次最多產生 3 個 `split` 子細胞建議
- 未提供 index 對照資訊時，必須降級報告並標記「Index Gate 檢查不完整」
- 不得輸出任何實際檔案修改指令作為執行步驟

## 6. 第一個試跑（示例，不真的動 `_VibeCore/`）

### 6.1 假設目標
- `targetRoot = _VibeCore/`
- 主題：`V2 SSR-native blueprint governance split`

### 6.2 示例輸出檔案名稱（Analyze-only）
- `_workspace/vibecore-evolver/output/AA-RP-analyze-summary.md`
- `_workspace/vibecore-evolver/output/AB-RP-proposal-E001.json`
- `_workspace/vibecore-evolver/output/AC-RP-illegal-references.json`
- `_workspace/vibecore-evolver/output/AD-RP-index-patch-proposals.json`
- `_workspace/vibecore-evolver/output/AE-RP-evolution-log.md`

### 6.3 示例判讀重點
- 是否先做 Naming Compliance，再做 Index Gate
- 是否正確列出未註冊引用（Illegal References）
- 是否提出 Index Patch Proposals（提案，不修改）
- 是否將可裁決 Gene 正確識別為 split 候選

## 7. MVP 範圍（明確）

### 7.1 本版要做（Analyze-only 討論規格）
- 掃描與分析規格定義
- Proposal schema 定義
- Index Gate 檢查與提案格式
- 輸入/輸出格式與防呆條款
- RP 輸出命名規則（native 編碼）

### 7.2 本版不做
- Skill 實作
- 自動改檔
- index 自動更新
- 連結自動重寫
- 套用 proposal

## 裁決條款

### 硬規則
- MVP 預設且僅限 Analyze-only。
- 必須產出 `Illegal References Report` 與 `Index Patch Proposals`。
- 一次最多產生 3 個 split 子細胞建議。
- 所有 Analyze 輸出檔案命名必須使用 `RP` 類型 native 編碼。

### 建議
- 第一輪試跑聚焦 `new_engineering/`，不要一開始掃整個 `_VibeCore/`。
- 先驗證輸出可讀性，再討論分數權重與更多提案類型。
