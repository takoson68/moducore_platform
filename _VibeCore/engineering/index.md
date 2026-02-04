# Engineering Index

本文件為本專案工程層的唯一入口（Single Entry Point）。

Engineering 層用於約束「如何工作」，
不得違反任何 `_VibeCore/world/` 中已定義的世界法則。

本文件負責：

- 判斷是否進入工程行為
- 裁決工程行為應遵守的紀律
- 指引何時需要查閱其他工程或交流文件

---

## Scope & Priority

- World 規則（`_VibeCore/world/`）永遠優先
- Engineering 規則僅影響日常工程行為
- 若 Engineering 與 World 規則衝突，必須立即停止並回報

---

## When to Enter Engineering

以下任一情況成立，即視為進入 Engineering 層，必須遵守本文件：

- 撰寫或修改程式碼
- 建立或調整目錄／檔案
- 調整 module、container、boot、lifecycle 等工程行為
- 記錄或更新問題、變更、Git 紀錄

若僅進行以下行為：

- 世界層概念釐清
- 架構推論與分析
- 與 AI 進行尚未裁決的討論

→ **不需要進入 Engineering**
→ 應記錄於 `_VibeCore/feedback/`

---

## Rule 1：Problem Discovery Obligation（問題揭露義務）

當在分析或工程行為中發現問題，必須擇一：

1. 立即修正
2. 明確判定為「暫不修正」

若選擇 **暫不修正**：

- **必須記錄於 `_VibeCore/feedback/KNOWN_ISSUES.md`**
- 不得僅在對話中提及而未留下書面紀錄

原則：

> 沒修可以，但不能沒記。

---

## Rule 2：Issue vs Discussion Boundary（問題與交流邊界）

必須嚴格區分以下三類紀錄位置：

### A. Known Issues（已知問題）

**記錄位置**
- `_VibeCore/feedback/KNOWN_ISSUES.md`

**適用於**

- 明確存在的錯誤或風險
- 已知技術債
- 世界或工程規則下的違規狀態

---

### B. Discussions（需人類裁決的交流）

**記錄位置**
- `_VibeCore/feedback/DISCUSSIONS.md`

**適用於**

- 發現合理但未被 World 明確定義的需求或角色
- 結構選擇存在分歧、但尚未構成錯誤
- 需要人類決策方向的設計問題

說明：

> Discussions 屬於「未定案內容」，
> **不得當成工程規則或 World 法則引用。**

---

### C. Assumptions（工程假設）

**記錄位置**
- `_VibeCore/feedback/ASSUMPTIONS.md`

**適用於**

- 為完成任務而暫時採用、但 World 文件尚未定義的假設
- 即使未造成錯誤，也必須記錄

---

## Rule 3：Core Change Logging

涉及以下變更時，**必須更新 `_VibeCore/engineering/CHANGELOG.md`**：

- World boot 流程
- Container 行為或能力註冊策略
- Module 掃描／註冊／初始化流程
- Engineering 或 World 規則本身的調整

不需要記錄 CHANGELOG 的情況：

- 小型 bug 修復
- 不影響整體行為的局部實作

---

## Rule 4：Decision Visibility（決策顯性化）

本專案 **不設立獨立的 DECISIONS.md**。

決策的正確歸屬如下：

- **已實作、已生效的決策**
  → `_VibeCore/engineering/CHANGELOG.md`

- **尚未定案、分析與推論中**
  → `_VibeCore/feedback/DISCUSSIONS.md`

- **因未處理而留下風險**
  → `_VibeCore/feedback/KNOWN_ISSUES.md`

- **純人類暫存思考**
  → `_workspace/`
  （AI 不得主動讀取或引用其內容）

原則：

> 決策不能消失，但不需要獨立會議室。

---

## Rule 5：Minimal Legitimate Change

在未被明確要求下：

- 不得重構
- 不得改架構
- 不得延伸功能

工程行為必須聚焦於：

> 完成「當日目標所需的最小合法變更」

---

## Rule 6：World Modification Guard

任何對 `_VibeCore/world/` 的修改行為：

- 必須先符合 `_VibeCore/world/08_CHANGE_PROTOCOL.md`
- 僅能提出建議，不得自行修改
- 必須明確指出修改類型：
  - 澄清（Clarification）
  - 精煉（Refinement）
  - 行為變更（Behavior Change）

---

## Rule 7：Git Discipline（概要）

Git 僅用於保存進度與歷史脈絡，
非發版、非審核流程。

具體觸發與流程：
→ 請參考 `_VibeCore/engineering/GIT_AUTOMATION.md`

未被明確觸發前：

- 不得自行 commit
- 不得自行 push

---

## Rule 8：Vue Output Format（唯一合法形式）

工程產出任何 `.vue` 檔案時，**必須符合以下格式規範**：

- `<script>` **必須** 使用 `<script setup>`
- `<template>` **必須** 使用 `pug`（`<template lang="pug">`）
- `<style>` **必須** 使用 `sass`（縮排語法，非 scss）

### Scoped 使用規則

- 預設 **不得** 使用 `scoped`
- 若必須使用：
  - 必須在工程紀錄中說明原因
  - 理由需與樣式隔離或副作用風險直接相關
- 未說明即使用 `scoped`，視為不合法工程產出

---

## Invariants

- 工程紀律優先於短期速度
- 可回溯性優先於即時便利
- **未被記錄的工程行為，視為不存在**

---

## 附屬技術規範（在不衝突前提下生效）

以下文件僅在 **不違反 World 規則與 Engineering Index** 的前提下適用：

- 工程慣例與約定（Conventions）
  → `_VibeCore/engineering/CONVENTIONS.md`

若附屬技術規範與 Engineering Index 發生衝突：

→ **立即停止該工程行為，並以 Engineering Index 為最終裁決依據。**

---

## Rule X：Just-in-time Structure（按需落地）

`_VibeCore/` 目錄用於敘事、推論與裁決；
`platform/` 目錄用於工程實作。

工程實作目錄與檔案 **不得為了「未來可能會用到」而預先建立**，
只能在符合以下條件時建立：

- 今日任務需要實作該能力或流程，且沒有該落點會阻礙完成
- 建立後可立即被引用並可用最小方式驗證（可執行 / 可 import / 可跑流程）
- 不建立空殼目錄來佔位（除非世界文件或工程規範明確要求）

原則：
> 結構可以推論，但實作必須被需求拉動。

---

## Engineering Task Trigger

當任務以以下關鍵字開頭時：

[code]

視為進入正式工程任務流程，AI 必須：

1. 自動讀取 `_VibeCore/feedback/DISCUSSIONS.md`
2. 僅依據其中已標示為 OPEN 的事項執行任務
3. 不得自行擴張目標或引入新工程範圍
4. 若 DISCUSSIONS 內容不足以形成可落地工程行為：
   - 開頭請用********隔開，才不會誤以為是原文
   - 必須回寫「待釐清」至 `_VibeCore/feedback/DISCUSSIONS.md`
   - 並停止執行
5. 所有工程回饋須遵循 Engineering Index 定義之回饋位置

---

End of Engineering Index
