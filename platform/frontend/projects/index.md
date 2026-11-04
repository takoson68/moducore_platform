# Frontend Project Registry

## 範圍

本目錄保存 Vite 可選取的前端 Project 實例。每次建置由 `VITE_PROJECT` 選擇一個 Project；設定入口是 `project.config.js`，實際功能須再沿該 Project 的 `modules/`、`layout/` 與相關程式碼驗證。

本索引是執行程式目錄導讀，不取代 `_VibeCore/projects/index.md` 的 Project 世界定義，也不要求歷史 Project 全面補齊專案 Markdown 文件。

## Project 清單

| 目錄 | 設定名稱／用途線索 | 入口 |
|---|---|---|
| `project-a/` | Project A；Vite 未設定 `VITE_PROJECT` 時的預設 fallback | `project.config.js` |
| `project-b/` | Project B，含 employee、task、vote 等設定模組 | `project.config.js` |
| `dineCore/` | 餐廳點餐與營運工作流程 | `project.config.js` |
| `eatGoMap/` | 食旅共享地圖與日誌；目前提供合成資料的地圖首頁視覺原型 | `index.md` → `PROJECT_CONTEXT.md` → `project.config.js` → `docs/index.md` → `modules/index.md` |
| `chatCore/` | 私人聊天室技術實驗入口與控制台 | `index.md` → `project.config.js` → `docs/index.md` |
| `flowCenter/` | 企業內部請假、採購、公告、任務與審核流程 | `project.config.js` |
| `game-demo/` | Game 能力的最小遊戲試玩 Project | `project.config.js`；遊戲能力從 `../../src/app/game/index.md` 導讀 |
| `magic-siege/` | 「攻破魔法城」格子塔防幾何原型；學習階段參考 Infinitode 2 核心體驗 | `index.md` → `PROJECT_CONTEXT.md` → `project.config.js` → `docs/index.md` |
| `modudesk/` | ModuDesk，包含 sticky-board、calendar、tasks 設定 | `project.config.js` |
| `_proTemp/` | Project Template 骨架 | `project.config.js` |

表格只提供尋路線索；模組清單與專案現況以設定及程式碼為準，不由名稱推定成熟度、線上部署狀態或工作優先級。

## 任務導讀

- 修改 Project 業務 UI：讀目標 `project.config.js`、`modules/index.js`（若存在）、對應模組 `index.md`（若存在）及畫面實作。
- Project／模組安裝問題：從 `project.config.js` → `modules/index.js` → `platform/frontend/projects/moduleDiscovery.js`、`modulesRegistry.js` → `src/app/boot/boot.js` 追蹤。
- 新建 Project：先讀 `_VibeCore/projects/index.md`，再按其規定讀 Authoring Standard、Scaffold Protocol、Config Schema 與 Templates Index；不可直接複製本目錄任一舊 Project 當正式模板。
- 部署 Project：依根 `AGENTS.md` 部署關鍵字路由與 `_VibeCore/engineering/TAG_DEPLOYMENT_MANUAL.md`，確認該 Project 是否有白名單目標。

## 權限與裁決

- 此索引列舉目前檔案系統可見設定，不代表每個 Project 都是已部署、可營運或活躍狀態。
- 既有專案缺少 `index.md`／`PROJECT_CONTEXT.md` 不自動構成違規；只有新建或明確要求整理的 Project，依 `_VibeCore/projects/index.md` 建立適用文件。
- 若索引快照與 `project.config.js` 不一致，以原始碼確認實況並更新本索引。
