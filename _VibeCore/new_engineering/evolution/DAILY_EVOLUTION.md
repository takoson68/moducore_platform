# Daily Evolution Task

本文件定義「規範演化的每日一次任務」。

## 任務目標
- 針對 moducore_platform/platform/ 的最新工程變更
  自動歸類、辨識 boundary friction
- 產出今日 log（一天一份）
- 必要時提出新增/拆分候選規範（僅 candidate/active）
- 所有新增文件必須列入 new_engineering/index.md

## 防重跑規則（強制）
- 任務每天只允許執行一次
- 執行前必須檢查：
  - new_engineering/evolution/daily_state.json
- 若 state 顯示今日已執行：
  - 必須跳過任務，直接進入一般任務流程

## 執行資料來源（唯一）
- 以 git diff 或最近一次變更摘要為準
- 僅限於 moducore_platform/platform/ 範圍

## 輸出位置（唯一）
- new_engineering/evolution/daily_log/YYYY-MM-DD.md

## 輸出格式
- 必須使用 templates/DAILY_LOG_TEMPLATE.md

## 規範演化限制（預設）

- Daily Evolution Task 不得自行：
  - 建立 rules/
  - 升級 stable

- 當符合「升級請求條件」時：
  - 必須建立 Promotion Proposal
  - 並列冊至 new_engineering/index.md
  - 不得直接執行升級



## 升級請求條件（Promotion Conditions）

以下條件僅用於「提出升級請求」，不構成自動升級：

### Convention → Stable（請求條件）
- 同一 convention 相關 friction 記錄 ≥ 3 次
- 連續 3 個不同日期均未出現反向 friction
- 涉及至少 2 個不同 scope（如 project / module / boot）

### Boundary → Rule（請求條件）
- 邊界相關 violation signal ≥ 2 次
- 至少 1 次 violation 造成明確工程成本
- 嘗試調整 convention / boundary 仍無法解決
