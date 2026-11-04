# Frontend 子系統索引

## 範圍

本目錄是 Vue 3 + Vite 前端平台，包含共享 Runtime、Project 實例、前端測試與建置腳本。平台語意與工程邊界分別由 `_VibeCore/world/index.md`、`_VibeCore/engineering/index.md` 裁決；Repository 實作導讀見 `_VibeCore/AI_PROJECT_ENTRY.md`。

## 閱讀順序與路由

1. 先讀根目錄 [`projects/index.md`](./projects/index.md) 確認 `VITE_PROJECT` 與 Project 配置。
2. 啟動、Container、Module、Router、Store 任務讀 `src/main.js`、`src/world.js`、`src/app/boot/` 及 AI Project Entry 的相應段落。
3. 遊戲 Runtime 任務先讀 `src/app/game/index.md`，引擎任務再讀 `src/app/game/engines/index.md`。
4. API／Auth 任務依 `platform/worker/index.md` 與 `_VibeCore/api/index.md` 追蹤前後端契約。
5. 執行指令以 `package.json` 為準；Build／測試只跑與本次 Project 和功能相關的腳本。

## 重要現況

- `VITE_PROJECT` 選擇單一前端 Project；Vite 未設定時預設 `project-a`。以 `vite.config.js` 和建置輸出再次核對。
- 本機一般 Build 會輸出至 `projects/<project>/dist`，並透過 Vite plugin 複製成品至 `platform/backend/public`；Cloudflare Build 使用根 `dist` 並略過該複製流程。部署目標須再核對 Worker 設定與 Workflow。
- `projects/` 的既有 Project 導讀見 [`projects/index.md`](./projects/index.md)；不是每個歷史 Project 都必須已有 Markdown 專屬 index。
- Project 內專題文件若存在 `docs/index.md`，先按該索引辨別正式背景、規劃與歷史材料；不要把規劃文件當已實作功能。

## 權限

此索引不授權修改其他 Project、正式 World、遠端部署或覆蓋使用者既有修改。
