---
name: module-scaffold
description: 建立或擴充 frontend project module 骨架（index.js/routes.js/pages/index.vue/store.js/service/api），並強制對齊 _VibeCore/engineering/MODULE_TEMPLATE_CONTRACT.md；適用於「新增新模組」或「把零散模組補齊為合法骨架」。
---

# Module Scaffold Skill

## 何時使用

- 使用者要求「建立新模組」
- 既有模組缺少標準骨架（例如沒有 `routes.js` 或 `index.js`）
- 需要把模組補齊到可被 `modules/index.js` 掃描與掛入的合法狀態

## 強制依據

- `_VibeCore/engineering/MODULE_TEMPLATE_CONTRACT.md`
- `_VibeCore/engineering/CONVENTIONS.md`
- 目標專案現有模組風格（先讀同專案現有模組再生成）

若三者衝突：
1. `MODULE_TEMPLATE_CONTRACT.md`
2. `CONVENTIONS.md`
3. 專案既有風格

## 輸入

最少需要：

- `project_name`（例：`dineCore`）
- `module_name`（例：`announcement`）
- `route_path`（例：`/staff/manager/announcement`）
- `access`（`public/auth` 布林）
- `nav`（label 與 order；若不顯示可空陣列）

可選：

- `need_store`（boolean）
- `need_service`（boolean）
- `need_api`（boolean）
- `identity_access`（roles/includeCompanies/excludeCompanies）

## 產出檔案

最小集合：

- `platform/frontend/projects/<project_name>/modules/<module_name>/index.js`
- `platform/frontend/projects/<project_name>/modules/<module_name>/routes.js`
- `platform/frontend/projects/<project_name>/modules/<module_name>/pages/index.vue`

依輸入追加：

- `store.js`
- `service.js`
- `api/*.js`

## 固定流程

1. 先讀目標專案現有 1-2 個模組（同類型頁面）確認命名與語氣。
2. 建立模組目錄與最小檔案集合。
3. 按 contract 寫入 `index.js`：只做宣告，不可副作用。
4. 按 contract 寫入 `routes.js`：必含 `meta.access` 與 `meta.nav`。
5. 建立 `pages/index.vue`：
   - 必須 `script setup`
   - 必須 `template lang="pug"`
   - 必須 `style lang="sass"`
6. 若 `need_store=true`：建立 `store.js` 並使用 `world.createStore(...)`。
7. 若 `need_service=true` 或 `need_api=true`：建立對應檔案並把 transport/service 分層。
8. 更新 `platform/frontend/projects/<project_name>/project.config.js` 的 modules 清單（若尚未掛入）。
9. 執行驗證命令：
   - `npm --prefix platform/frontend run build`
10. 回報變更檔案清單與驗證結果。

## 驗證清單（必做）

- 新模組可被 `modules/index.js` 掃描
- route 可進入，且 `meta.access` / `meta.nav` 結構完整
- `index.js` 只有宣告，沒有 API 呼叫/登入/router 操作
- `store.js`（若存在）只透過 `world.createStore`
- build 成功

## 失敗處理

- 若 `project_name` 不存在：停止並回報可選專案名
- 若 `route_path` 已被占用：停止並列出衝突路由
- 若 build 失敗：
  - 先修 compile/lint 層錯誤
  - 再回報仍未解決的錯誤與檔案位置

## 禁止事項

- 不得直接改 world 規則
- 不得在 `index.js` 做副作用
- 不得直接 import `@/app/*` 底層 store 實作
- 不得跳過 build 驗證

## 標準回報格式

- `Output Category`: Module-Level Output
- `Impact Layer`: Module / Project
- `Changed Files`: 路徑清單
- `Validation`: build 結果
- `Notes`: 任何偏離預設流程的原因
