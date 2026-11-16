---
status: active
phase: cloudflare-transition
authority: workflow-guide
updated: 2026-10-15
implemented: true
canonical: ../_VibeCore/engineering/AI_WORKFLOW.md
---

# AI 實作引導

## 專案定位

moduCore 是以 World 治理、Container 能力註冊及可插拔 Module 為核心的多 Project 平台。現在處於 Cloudflare 部署轉換前期：前端架構原則上保留，舊 PHP／MySQL 後端將逐步替換為 Workers JavaScript + D1／SQLite。

本文件提供日常操作導引；正式工程流程以 `_VibeCore/engineering/AI_WORKFLOW.md` 為準。

## 任務開始

1. 完成 `_ai-context/index.md` 的初始化必讀。
2. 依 `_VibeCore/RootIndex.md` 的合法導讀鏈完整閱讀 World 主鏈 00–09，再讀適用的 Engineering Contract 與任務目錄 `index.md`；先把規則轉成檢查點，再讀取相關實作。
3. 讀取 `CURRENT_WORK.md`，以 Git 與實際檔案確認記錄仍有效。
4. 確認目標、完成條件、禁止事項與影響範圍。
5. 執行 `git status --short --branch`，辨識使用者既有修改。
6. 只搜尋與任務直接相關的程式與證據。
7. 需求已明確時直接執行；只有重大分歧、資料風險或外部權限不足時詢問。

World 憲法優先於使用者需求、操作導引、Project 決策與既有實作。使用者需求用來界定目標，不構成覆寫 World 規則的授權。若 World 入口或導讀鏈有衝突，依 `STARTUP_DECLARATION.md` 停止受影響工作並指出衝突；若實作與適用規則衝突，不能以「目前就是這樣」作為理由，應在授權範圍內修正，否則記錄未解項目且不得宣稱符合。完成後須用開始階段建立的檢查點核對責任層、模組註冊、Store／Storage 資料流與 API 邊界。World 內容僅能依 World Change Protocol 處理。

## 執行模式

### 分析任務

- 不修改程式。
- 以檔案路徑、程式碼、設定與命令結果支持結論。
- 將事實、推論、風險與待確認分開。
- 報告預設放 `_workspace/_reports/`。

### 實作任務

- 採最小合法變更。
- 不為單一需求新增未證明必要的抽象。
- 修改後執行與風險相稱的 Build、Test、Smoke 或人工驗證。
- 每完成一個里程碑，先通過 Gate 才進下一階段。

### 部署任務

- **「我要部署」「部署這版」「發布新版本」「Tag 部署」**：路由到 `_VibeCore/engineering/AI_WORKFLOW.md` §3.1，按其授權邊界與 Gate 自動完成 Staging 新版本流程；細節以 `_VibeCore/engineering/TAG_DEPLOYMENT_MANUAL.md` 為準。
- **「版本替換」「切換已發布版本」「回退 previous」**：使用部署手冊的既有版本控制台／受控 Workflow 路徑，不建立新 Tag。
- 單獨「推送」「Push」「儲存進度」是一般 Git 保存，不觸發部署；依 [Git 工作規則](./Git工作規則.md)。
- 部署關鍵字的授權範圍、安全停止條件與版本選擇只有一份正式細則：`_VibeCore/engineering/AI_WORKFLOW.md` §3.1。本摘要只負責辨識和導讀，避免規則多份複製後失同步。

## 完成條件

- 需求產出已存在。
- 驗證已執行並記錄。
- 工作樹每項變更都能說明。
- 正式文件與索引已同步。
- `CURRENT_WORK.md` 已更新。
- 未驗證項目與剩餘風險已揭露。

## 任務結案

1. 更新 `CURRENT_WORK.md`。
2. 將一次性分析放入 `_workspace/_reports/`。
3. 將穩定問題、討論或假設整理到 `_VibeCore/feedback/`。
4. 影響 Engineering 的變更更新 `_VibeCore/engineering/CHANGELOG.md`。
5. 未經使用者明確要求，不自行 Commit 或 Push。
