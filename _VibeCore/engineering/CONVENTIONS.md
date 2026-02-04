# 程式規範（給 AI）
本文件記錄在實際工程中反覆出現、
尚未上升為 Engineering 層的操作約定。

本文件內容可隨工程實務持續補充與調整，
但其存在不構成 Engineering 規則，
亦不得用以覆寫或挑戰上層裁決。

## 語言／技術堆疊
- 前端：Vite + Vue 3 + Vue Router + Sass。
- 後端：PHP（`backend/api/*.php`）。

## 格式化與風格
- JS/TS：2 空白縮排，結尾分號，與既有檔案風格一致。
- Vue：以單檔元件為主，Options/Composition 混用，依現有模組寫法為準。
- PHP：`declare(strict_types=1);` 必須為第一行，避免 BOM（見 `PROJECT_CONTEXT.md`）。

## 命名慣例
- 模組資料夾：小寫英文字（`task`, `vote`）。
- 避免用 `.` 作為檔名語意切割，採駝峰或角色字尾命名（見 `frontend/moducore模組設計規範.md`）。

## 專案結構與責任邊界
- 模組唯一入口：`src/modules/<name>/index.js`，只宣告 `{ name, meta?, setup }`。
- 模組不可直接 import 其他模組內部檔案。
- 模組不得直接操作平台 lifecycle/boot/router，僅透過容器與 install 流程。
- 平台層唯一副作用集中在 `src/modules/index.js` 的 `installModules()`。

## 容器與 Store 使用
- 取得 store/service 一律用 `container.resolve('<name>')`。
- 模組註冊 store 用 `register.store(name, factory)`（避免直接操作容器）。
- 登入/登出只透過 `authStore.login` / `authStore.logout`，不直接操作 `tokenStore`。

## 路由與權限
- 每個 route 必須同時具備 `meta.public` 與 `meta.auth`（布林），缺少會拋錯。
- 導航顯示用 `meta.nav`（含 `label`、`order`、`parent`）。
- 若使用巢狀路由，`parent` 填絕對路徑（`/foo`）。

## API 規範
- 平台 `src/api` 只放登入前或平台級流程，不堆積業務資料。
- 模組資料請放在各自的 `src/modules/<name>/api/`。
- `src/api/client.js` 會自動帶 token 並攔截 401；改動需考量登出與路由流程。

## 樣式規範
- 主題切換唯一方式：
  - `document.documentElement.dataset.theme = 'dark'`（見 `frontend/src/styles/_樣式責任.md`）。
- 設計 token 優先使用 Sass/CSS 變數（`_tokens.sass`, `_vars.sass`）。

## 測試
- 目前未建立正式測試體系；新增時請與現有流程一致並保持最小侵入。

## 錯誤處理
- 前端：避免在模組層直接攔截平台級錯誤；統一由 API client 或平台層處理。
- 後端：統一使用 `Db.php` 進行 CRUD（見 `backend/使用手冊.md`）。

## 效能與安全
- 模組設計需可拔插，不假設一定存在。
- 避免在模組 `index.js` 中執行副作用。

## 給 AI 的明確指示
- 不確定需求或命令意涵時先問，避免推測。
- 變更需對照既有規範與模組設計文件。
- 若有重大更改或調整關鍵流程／函式，必須同步更新 `_VibeCore/core/CONTEXT.md` 或本檔。
