# chatCore 私人聊天室實驗

---

## 0. 本專案的角色

本目錄是私人聊天室技術實驗的獨立前端 Project，提供進入頁面、實驗控制台與後續模組落點。

本 Project 不定義平台 World／Container 規則，也不改變 dineCore、公開聊天室或其他 Project 的會員及租戶邊界。

## 1. 專案目的

- 以獨立 `VITE_PROJECT=chatCore` 驗證專案頁面與模組註冊方式。
- 逐階段實驗私人文字聊天室；本階段尚未提供聊天或會員功能。
- 在控制台明確呈現尚未開放的能力及 Project 導覽。

## 2. 閱讀順序

1. `index.md`
2. `PROJECT_CONTEXT.md`
3. `project.config.js`
4. `docs/index.md`
5. `modules/index.js` 與各模組入口
6. `decisions/`

## 3. 專案結構

- `project.config.js`：Project 身分及模組清單。
- `layout/`：Project 頁面承載殼層。
- `modules/entry/`：實驗入口頁。
- `modules/console/`：能力狀態與本地 Project 連結。
- `modules/private-chat-lab/`：M1 兩個 Peer 的 DataChannel 實驗與房間邀請頁。
- `styles/sass/main.sass`：Project 基礎樣式。
- `docs/`：實驗里程碑及執行結果。
- `decisions/`：Project 邊界與架構決策。

## 4. 入口與啟動點

- 啟動選擇：`VITE_PROJECT=chatCore`。
- 進入頁：`/`，由 `entry` 模組註冊。
- 控制台：`/console`，由 `console` 模組註冊。
- 啟動設定：`project.config.js`；模組收集入口：`modules/index.js`。

## 5. 模組與頁面範圍

- `entry`：實驗介紹及控制台連結。
- `console`：會員管理、聊天室管理、一對一私人連線的狀態卡片，以及明確設定的其他 Project 連結。
- `/lab` 使用 chatCore 專屬 Signaling Worker；Staging 可讓朋友以房間連結加入，不提供歷史保存。

## 6. 專案限制

- 使用獨立 `tenant_id: chatCore`；頁面不代表 dineCore 會員授權。
- 不建立第二套帳號，不實作跨 Project 單一登入。
- 其他 Project 連結只負責導覽，目標 Project 自行驗證登入與授權。
- 實驗階段使用合成資訊；真實私人訊息上線前須另行討論 E2E 加密。
- 每個里程碑獨立驗證與檢討；未經使用者決定不推進下一階段。

## 7. 文件 Registry

- `PROJECT_CONTEXT.md`
- `project.config.js`
- `docs/index.md`
- `docs/M0A_RESULT.md`
- `docs/M1_RESULT.md`
- `docs/P2P_CHAT_MILESTONES.md`
- `layout/`
- `modules/`
- `styles/`
- `decisions/D001_project_identity.md`
- `decisions/D002_remote_experiment.md`

## 8. 裁決聲明

- 本檔是 chatCore Project 的唯一文件入口。
- 平台治理與工程 Contract 以 `_VibeCore/` 及平台索引導讀為準。
- 若本檔與高層規則衝突，以上層規則為準。
