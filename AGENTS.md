# ModuCore AI Entry

本檔是 Codex、Claude、Gemini 與其他 AI Agent 進入此 Repository 的通用入口。

## 初始化必讀

每次新對話、上下文重置或接手未完成工作時，依序導讀：

1. `_VibeCore/STARTUP_DECLARATION.md` 與 `_VibeCore/RootIndex.md`。
2. `_ai-context/index.md`，並讀取其「初始化必讀」列出的操作導引。
3. 僅讀當前任務所屬目錄的 `index.md` 與直接相關文件。

若任務涉及建立或修改工程內容，另依 `_VibeCore/RootIndex.md` 完整讀取 `_VibeCore/skills/index.md`。

初始化的目標是取得足夠且最新的上下文，不是全量預讀所有歷史文件。完成初始化後即可直接執行任務，不需要只回覆固定口令後停下等待。

`_ai-context/` 是操作與導讀層；`_VibeCore/` 才是正式治理與工程裁決來源。兩者衝突時一律以 `_VibeCore/RootIndex.md` 及其合法導讀鏈為準。

## 兩階段導讀：先平台，後 Project

ModuCore 的 AI 導讀分為兩個階段，不得在初始化時一次預讀所有 Project。

### 階段一：平台導讀

每次進入 Repository 時，先完成本檔、`_VibeCore/` 與 `_ai-context/` 要求的最小導讀，目的是理解：

- 平台的 World、Project、Module 與 Container 邊界。
- 索引式閱讀規則與工程行為限制。
- 可執行程式的子系統入口與任務分流方式。

此階段只取得平台共通知識，不讀取各 Project 的企劃、商務規則、模組實作或專屬文件。

### 階段二：Project 導讀

當使用者說明要建立或處理哪一個 Project，或任務內容已能唯一定位目標 Project 時，AI 才進入該 Project 的導讀鏈：

1. 先讀 `platform/frontend/projects/index.md` 確認 Project 入口與選取方式。
2. 若目標 Project 存在 `index.md`，必須先由該索引進入，不得先讀取其他 Project 內部文件。
3. 讀取目標 Project 的 `project.config.js`，確認專案身分、模組清單與最低語意宣告。
4. 若 Project 存在 `docs/index.md`，必須依其導讀選取與當前任務直接相關的企劃、規格與決策文件。
5. 再依任務讀取該 Project 的 `modules/index.js`、目標模組入口與直接相關原始碼。

若使用者尚未說明目標 Project，且現有任務無法唯一定位，AI 應先請使用者指定或命名 Project，不得為了猜測而掃讀全部 Project。

Project 專屬的企劃、玩法、商務邏輯、限制與決策，應放在該 Project 自己的 `docs/` 並由 `docs/index.md` 管理；不得因為某個 Project 需要，就將其文件註冊到平台共用的初始化導讀。只有已確認可跨 Project 重複使用的內容，才可整理為平台規格或共用範本。

### Project 導讀的例外與邊界

- **新 Project 尚未存在**：先讀 `_VibeCore/projects/index.md` 及其指定的 Authoring Standard、Scaffold Protocol 與 Config Schema，再與使用者確認 Project 名稱、目標與範圍。在名稱尚未確認前，不猜測目錄名也不建立專案骨架。
- **已有 `docs/` 但沒有 `docs/index.md`**：不掃讀整個目錄。只讀使用者明確指定的文件；若本次任務已授權整理該 Project 文件，才建立 `docs/index.md` 作為後續入口。
- **Project 需要共享 Runtime 變更**：Project 文件只能提出需求，不能直接授權修改平台。必須回到 `platform/frontend/index.md` 及對應 `src/**/index.md` 重新確認共享邊界。
- **Project 涉及 API、Auth、Worker 或 D1**：完成 Project 導讀後，另由 `platform/worker/index.md` 與 `_VibeCore/api/index.md` 進入後端契約，不把 Worker 程式視為前端 Project 的內部檔案。
- **Project 文件與實作不一致**：Project 文件說明預期目標與業務規則；原始碼、設定與測試說明當前實作。AI 必須分別列出「預期」與「現況」，不得默默以任一方覆蓋另一方。
- **Project 專屬文件的暫存**：目標 Project 尚未命名或建立時，專屬文件可暫存於 `_workspace/` 的明確主題目錄，但不得註冊為平台初始化必讀或共用範本。Project 建立後必須移入該 Project 的 `docs/` 並由 `docs/index.md` 導讀。

## 快速認識本 Repository

ModuCore 是多 Project 前端平台：Vue + Vite 前端依 `VITE_PROJECT` 一次載入一個 Project，透過平台 `world → boot → container/module → router` 啟動。儲存庫同時包含歷史 PHP/MySQL 後端、逐步移植中的 Cloudflare Worker/D1 後端，以及僅供本機使用的 Staging 版本控制台。這是現況摘要；任務中仍須由索引、設定與原始碼驗證。

完整 Repository 實務導讀：[`_VibeCore/AI_PROJECT_ENTRY.md`](_VibeCore/AI_PROJECT_ENTRY.md)。要了解可執行程式各子系統，先讀 [`platform/index.md`](platform/index.md)，再進入指定子系統索引。

## 任務關鍵字與閱讀路由

| 任務／使用者用語 | 從哪裡進入 | 下一步只讀相關內容 |
|---|---|---|
|「這個專案是什麼／整體架構」|本文件 → `_VibeCore/AI_PROJECT_ENTRY.md`|`platform/index.md`；需要正式語意時讀對應 `_VibeCore/**/index.md`|
|World、規則、生命週期、Container 邊界|`_VibeCore/world/index.md`|依 World Index 指定主鏈與子目錄 `index.md`|
|建立／修改 Project|`_VibeCore/projects/index.md`|需要認識現有前端 Project 時，再讀 `platform/frontend/projects/index.md` 及該 Project 的 `project.config.js`、`modules/index.js`|
|前端啟動、共用 UI、路由、Store、Module|`platform/frontend/index.md`|共享執行時依 `_VibeCore/AI_PROJECT_ENTRY.md` 的對應區段定位；必要時進 `src/**/index.md`|
|遊戲、p5、FPS、遊戲生命週期|`platform/frontend/src/app/game/index.md`|再按需求讀 `engines/index.md`；只有目標是 `game-demo` 或明確需要比對範例時，才讀其 Project 設定與模組|
|Worker、API、Auth、D1、Migration|`platform/worker/index.md`|再讀 `_VibeCore/api/index.md`、`_VibeCore/engineering/` 相關 Contract 與 Worker 測試|
|舊 PHP API 或行為比對|`platform/backend/index.md`|僅作舊行為參考；新功能不在 PHP 上擴寫|
|部署、Tag、版本替換、回退|`_ai-context/index.md` 的部署路由|新版本依 `_VibeCore/engineering/AI_WORKFLOW.md`、`TAG_DEPLOYMENT_MANUAL.md`；既有版本切換依版本控制台手冊|
|Git 保存、Commit／Push|`_ai-context/Git工作規則.md`|「我要部署」例外及其安全邊界依 `AI_WORKFLOW.md` 與 `GIT_AUTOMATION.md`|
|版本控制台程式|`platform/release-console/index.md`|再讀 `README.md`、對應 Engineering Contract；勿把本機 loopback 控制台當公開網站|
|效能評分或快照|`platform/performance/index.md`|評分方法與歷史結果按需讀取；最新測量不可由舊快照推定|
|候選工程慣例／每日演進|`_VibeCore/new_engineering/index.md`|只有該索引白名單項目可作為觀察或流程依據；不得把候選文件當正式規則|
|文件、里程碑、恢復工作|`_workspace/index.md`|先看 `CURRENT_WORK.md` 最新停止點；報告目錄與歷史資料再依 Workspace 索引導讀|

專案名稱、預設選擇或線上狀態不可只靠舊文件推定；分別檢查 `VITE_PROJECT`／`vite.config.js`、Project 設定、Git 與部署證據。不要為了「認識專案」而全量讀取所有歷史報告或 Project 原始碼。

## 核心限制

- 與使用者溝通、報告及程式註解使用繁體中文（台灣）。
- `_VibeCore/world/` 是最高治理層，未經世界變更流程不得修改。
- 文件與實作不一致時，必須同時指出預期規則與實際證據，不可默默假設兩者一致。
- 不覆蓋、不清除、不回退來源不明的既有修改。
- 未經使用者要求，不自行 Commit、Push、Merge 或部署。
- 分析、研究與規格報告預設輸出至 `_workspace/_reports/`。
- 舊 PHP／MySQL 後端是移植行為參考；目標後端是 Cloudflare Workers JavaScript + D1／SQLite。未經使用者改變方向，不新增 PHP 功能。

## 資訊優先級

發生衝突時依序判斷：

1. 使用者當前明確指令。
2. `_VibeCore/RootIndex.md` 與 `_VibeCore/world/`。
3. `_VibeCore/engineering/` 已生效規則。
4. 實際原始碼、設定、測試與命令輸出。
5. `_VibeCore/feedback/` 中已確認的狀態。
6. `_workspace/CURRENT_WORK.md`。
7. `_workspace/` 歷史草稿與舊報告。

`CURRENT_WORK.md` 只用來恢復停止點，不可覆蓋程式碼、正式規格或驗證結果。
