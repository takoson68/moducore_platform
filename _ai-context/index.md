---
status: active
phase: cloudflare-transition
authority: ai-entry
updated: 2026-10-15
implemented: true
---

# AI Context Index

`_ai-context/` 是 AI 的操作與導讀層，採用 `h5-basic-style` 的 AI Context 架構，但內容依 moduCore 現有治理重新整理。

本層不定義 World，不取代 `_VibeCore/`，也不能修改正式架構裁決。

## 初始化必讀（最小集合）

根目錄 `AGENTS.md` 已要求先讀 `STARTUP_DECLARATION.md` 與 `RootIndex.md`；以下是接續的操作導引，不重複載入入口文件：

1. [AI 實作引導](./AI_IMPLEMENTATION_GUIDE.md)：工作模式與部署等關鍵字分流。
2. [導讀規則](./導讀規則.md) 與 [語言規則](./語言規則.md)：按索引讀取、語言與任務路由。
3. [`_VibeCore/AI_PROJECT_ENTRY.md`](../_VibeCore/AI_PROJECT_ENTRY.md)：只讀與當前任務相關的 Repository 段落，不要求每次全篇預讀。
4. [`_workspace/CURRENT_WORK.md`](../_workspace/CURRENT_WORK.md)：只讀檔案最上方最新停止點；若任務與其無關或內容已過期，以 Git／程式碼驗證，不展開歷史記錄。

其餘摘要與規則依任務讀取：`ARCHITECTURE_RULES.md`、`ENGINEERING_STANDARDS.md`、`紀錄管理規則.md`、`Git工作規則.md`。初始化的目標是取得最小充分上下文，不全量讀取歷史報告、舊存檔或所有 Project。

## 按需讀取

- [工程標準摘要](./ENGINEERING_STANDARDS.md)：修改程式、設定、Migration、測試或部署時。
- [Git 工作規則](./Git工作規則.md)：查看狀態、建立分支、Commit、Push 或合併時。
- **部署關鍵字路由**：使用者說「我要部署」「部署這版」「發布新版本」時，先依 [AI 實作引導](./AI_IMPLEMENTATION_GUIDE.md) 的「部署關鍵字路由」分流，再讀 `_VibeCore/engineering/AI_WORKFLOW.md` 的部署請求規則與 `_VibeCore/engineering/TAG_DEPLOYMENT_MANUAL.md`；人工操作入口另見 `_workspace/範本/index.md`。
- 使用者說「版本替換」「切換已發布版本」「回退 previous」時，不建立或重用 Tag；依 `_VibeCore/engineering/TAG_DEPLOYMENT_MANUAL.md` 使用版本控制台，手冊位置由 `_workspace/範本/index.md` 導讀。
- 單獨說「推送」或「儲存進度」代表一般 Git 保存流程，不視為部署關鍵字；依 [Git 工作規則](./Git工作規則.md) 處理。
- `_VibeCore/skills/index.md`：建立或修改工程內容時，依 RootIndex 強制讀取。
- `platform/index.md`：需要理解、修改或驗證可執行程式時；從該索引分流到前端、Worker、舊 PHP 或 Release Console。
- `_VibeCore/projects/index.md`：建立、理解或修改 Project 時。
- `_VibeCore/api/index.md`：API、Auth、錯誤模型與生命週期任務。
- `_VibeCore/modules/index.md`：Module 註冊、初始化與資料互動任務。
- `_workspace/_reports/`：當前任務明確引用的研究或執行規格。

## 文件狀態

- `draft`：草稿，不可當成正式依據。
- `planned`：方案已整理但尚未落地。
- `active`：目前生效。
- `implemented`：內容已有實作或流程支援。
- `accepted`：已確認決策，變更需留下新紀錄。
- `reference`：參考資料，不代表目前實作。
- `superseded`：已被新文件取代。
- `archived`：歷史資料，預設不讀。

`implemented: true` 只表示該文件描述的機制已建立，不表示所有業務功能均完成。

## 資料分區

| 類型 | 位置 |
|---|---|
| AI 操作方式 | `_ai-context/` |
| World 與正式治理 | `_VibeCore/` |
| 當前工作與人類草稿 | `_workspace/` |
| 階段性研究與報告 | `_workspace/_reports/` |
| 實際程式 | `platform/` |

## 核心原則

- 先讀索引，再讀主題文件。
- 原始碼、設定、測試與命令輸出用來判斷實際現況。
- 實作現況不得反向推翻 World 或 Engineering 的正式規則。
- `CURRENT_WORK.md` 只用於恢復停止點，不是架構真相。
- PHP／MySQL 是舊後端參考；目標後端是 Workers JavaScript + D1／SQLite。
