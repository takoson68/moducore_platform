# Git 使用規則（單人極簡）

Git 在此專案中的用途：

- 保存工作進度
- 留下思考與調整的歷史標記
- 讓自己在未來能理解「當時在想什麼」

Git 不是：
- 發版系統
- 審核流程
- 工程治理機制

---

## 使用時機（語意觸發）

只有在我明確提到以下語意時，才進入 Git 流程：

- 「git 紀錄」
- 「儲存進度」
- 「記一下進度」
- 其他明確表示要保存目前狀態的指示

未被觸發時：
- 不要自行 `git add / commit`
- 不要主動 `git push`

### Staging 部署關鍵字的有限例外

使用者明確說「我要部署」「部署這版」「發布新版本」或「Tag 部署」時，依 `_VibeCore/engineering/AI_WORKFLOW.md` 的部署請求流程及 `_VibeCore/engineering/TAG_DEPLOYMENT_MANUAL.md` 執行。這代表使用者已授權該次 Staging 發布所必需、且限於本次變更白名單的 Commit、目標分支 Push 與全新唯一部署 Tag Push，不必再單獨等待「推送」確認。

此例外不適用一般 Git 保存；單獨「推送」「Push」「儲存進度」仍不部署。它不授權納入無關檔案、Production、刪除／移動／重用 Tag 或 Release、資料回復及其他超出本次 Staging 發布的外部變更。遇到不能安全隔離的既有修改或部署 Gate 失敗時停止，不可擴大白名單。

---

## 基本流程

1. 檢視 `git status`
2. 由 AI 協助整理：
   - 目前做了什麼
   - 建議的 commit 訊息
3. 由我確認後再進行 commit
4. 只有在我說「推送」時才 push

---

## 工作分類（擇一）

- feat     ：新增功能
- fix      ：錯誤修正
- refactor ：結構調整（無功能變更）
- docs     ：文件調整
- chore    ：設定 / 非功能性調整
- research ：分析 / 思考 / 尚未實作

---

## Commit 訊息格式
<分類> - <簡短摘要>


範例：

- feat - 新增使用者任務列表
- docs - 補充 world lifecycle 說明
- research - 盤點 module 註冊流程（未實作）

---

## CHANGELOG 使用原則（選用）

當你覺得「這是一個值得記住的節點」時：

- 可以同步補一條 CHANGELOG
- 與 commit 使用相同分類與摘要即可

CHANGELOG 是輔助記憶，不是義務。

---

## AI 行為約定

- 未被要求，不主動進行 Git 操作
- Git 只是保存，不代表完成或正確
- 一切以當下對話決策為準

---

End of Git Rules

