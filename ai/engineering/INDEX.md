# Engineering Index

本文件為本專案工程層的唯一入口（Single Entry Point）。

Engineering 層用於約束「如何工作」，
不得違反任何 `ai/world/` 中已定義的世界法則。

本文件負責：
- 判斷是否進入工程行為
- 裁決工程行為應遵守的紀律
- 指引何時需要查閱其他工程文件

---

## Scope & Priority

- World 規則（ai/world/00–08）永遠優先
- Engineering 規則僅影響日常工程行為
- 若 Engineering 與 World 規則衝突，必須立即停止並回報

---

## When to Enter Engineering

以下任一情況成立，即視為進入工程層，必須遵守本文件：

- 撰寫或修改程式碼
- 建立或調整目錄／檔案
- 調整模組、container、boot、lifecycle 等行為
- 記錄或更新問題、變更、Git 紀錄

若僅進行概念釐清、世界層討論或分析：
→ **不需要**進入 engineering。

---

## Rule 1：Problem Discovery Obligation（問題揭露義務）

當在分析或工程行為中發現問題，必須擇一：

1. 立即修正  
2. 明確判定為「暫不修正」

若選擇 **暫不修正**：

- **必須記錄於 `KNOWN_ISSUES.md`**
- 不得只在對話中提及而未留下書面紀錄

原則：
> 沒修可以，但不能沒記。

---

## Rule 2：Known Issues Recording

以下情況必須記錄為 Known Issue：

- 已知會造成後續風險
- 技術債、流程缺口、邏輯不一致
- 因時間或範圍刻意略過的問題

以下情況不必記錄：

- 已即時修正且無殘留風險
- 純實驗性、未進主流程的嘗試

---

## Rule 3：Core Change Logging

涉及以下變更時，**必須更新 `CHANGELOG.md`**：

- World boot 流程
- Container 行為或能力註冊策略
- Module 掃描 / 註冊 / 初始化流程
- Engineering 或 World 規則本身的調整

不需要記錄 CHANGELOG 的情況：

- 小型 bug 修復
- 不影響整體行為的局部實作

---

## Rule 4：Decision Visibility（決策顯性化）

工程中的決策不另設 DECISIONS.md。

決策的正確歸屬如下：

- 已實作、已生效的決策 → `CHANGELOG.md`
- 尚未定案、分析中 → `_workspace/今天.txt`
- 因未處理而留下風險 → `KNOWN_ISSUES.md`

原則：
> 決策不能消失，但不需要獨立會議室。
_workspace/ 僅作為人類思考與暫存空間，
AI 不應主動讀取或引用其內容。

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

任何對 `ai/world/` 的修改行為：

- 必須先符合 `08_CHANGE_PROTOCOL.md`
- 僅能提出建議，不得自行修改
- 必須明確指出修改類型（澄清 / 精煉 / 行為變更）

---

## Rule 7：Git Discipline（概要）

Git 的使用僅用於保存進度與歷史脈絡，
非發版、非審核流程。

具體觸發與流程：
→ 請參考 `GIT_AUTOMATION.md`

未被明確觸發前：
- 不得自行 commit
- 不得自行 push

---

## Invariants

- 工程紀律優先於短期速度
- 可回溯性優先於即時便利
- 未被記錄的工程行為，視為不存在

---

End of Engineering Index
