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

## 新專案 Auth 規範
- 前端登入真相來源只能有一個：平台 `authStore`。
- 專案層可包一層 auth service，但只能封裝 `world.authApi().login()`、`restoreSession()`、`logout()`，不得再建立第二份 project-local auth state 來決定是否登入。
- UI 的 `isLoggedIn`、`role`、`company_id`、顯示名稱，一律從 `authStore.state.user` 或 `authStore.isLoggedIn()` 推導。
- 若新專案需要額外身份欄位，應優先補後端 `/api/login` 與 `/api/session` payload，不得以前端額外打一條 project session API 來補出第二份登入真相。
- project-specific session API 若存在，只能作為補充資料或後端 context 驗證，不得成為前端 auth gate。
- 平台標準 auth pattern 必須包含：
- `login / restoreSession / logout` 全部走 `world.authApi()`
- auth UI 與 route guard 只依賴 `authStore`
- 不允許 project-local auth truth 與 `authStore` 並存
- 任何新專案若偏離此 pattern，必須先在工程紀錄中說明理由與風險，不能直接實作。

## 樣式規範
- 主題切換唯一方式：
  - `document.documentElement.dataset.theme = 'dark'`（見 `frontend/src/styles/_樣式責任.md`）。
- 設計 token 優先使用 Sass/CSS 變數（`_tokens.sass`, `_vars.sass`）。

## 測試
- 目前未建立正式測試體系；新增時請與現有流程一致並保持最小侵入。

## 錯誤處理
- 前端：避免在模組層直接攔截平台級錯誤；統一由 API client 或平台層處理。
- 後端：統一使用 `Db.php` 進行 CRUD（見 `backend/使用手冊.md`）。

## Issue 管理慣例
- `KNOWN_ISSUES.md` 只保留仍在追蹤中的問題（`Open` / `Mitigated`）。
- 問題一旦完成修正並確認關閉，必須自 `KNOWN_ISSUES.md` 移出。
- 已關閉問題統一移至 `_VibeCore/feedback/RESOLVED_ISSUES.md` 保存歷史脈絡。
- 不得讓已關閉 issue 長期滯留在 `KNOWN_ISSUES.md`，避免污染當前待處理列表。

## 效能與安全
- 模組設計需可拔插，不假設一定存在。
- 避免在模組 `index.js` 中執行副作用。

## 給 AI 的明確指示
- 不確定需求或命令意涵時先問，避免推測。
- 變更需對照既有規範與模組設計文件。
- 若有重大更改或調整關鍵流程／函式，必須同步更新 `_VibeCore/core/CONTEXT.md` 或本檔。
## Module Store Boundary
- 模組狀態必須由模組自己的 `store.js` 持有，並透過 `setup.stores` 與 `register.store(...)` 註冊。
- `services/` 可以建立，但其角色限定為 project-level 能力，例如 transport、API client、純資料轉換、與專案級協調入口。
- `services/` 不得成為跨模組業務狀態中心，不得持有模組私有 state，不得形成 module-to-module 耦合鏈。
- page / component 可以使用模組 store 與模組 service，但不得以 project-level service 取代 module store。
- 不得為了快速串接而把多個模組的業務狀態集中到單一 project service；這會破壞模組可註冊、可卸載、可觀測的邊界。
- 若某個 service 的存在會讓模組必須知道其他模組內部資料形狀、生命週期或狀態欄位，視為耦合，必須拒絕。
- 若需求看起來必須突破此規則，必須先提出最小變更提案，不能直接改寫模組設計哲學。

## 自 new_engineering 倒入的正式規範

### Project API Boundary Non-Pollution
- 專案層或模組層的 API 對齊需求，必須優先在該 project 自有的 API adapter、service 或 module 內處理。
- 不得因單一 project 的 endpoint、method、payload 或 response 調整，直接修改 `platform/frontend/src/` 內的共享 API helper。
- 只有當需求已被證明為跨 project 共通能力，且完成明確提案後，才可升級到共享層。

### Module Data Ownership
- 模組本身必須解決自己的資料需求。
- 模組需要的 endpoint、payload、response mapping、錯誤處理、adapter 邏輯，應優先收斂在該模組或該 project 自有 API 層。
- 不得因單一模組的資料需求，回推修改共享層、其他模組，或把 module-specific 契約偽裝成平台共通能力。
- 共享層只能承載真正跨模組、跨 project 都成立的共用能力，不承載單一模組的資料語意。

### Module Registry Boot Pipeline
- `projects/<project>/modules/index.js` 是模組收集與安裝的唯一入口。
- `modules/index.js` 只負責收集模組 loader、載入模組、列出模組名單、依 allowList 安裝模組。
- 每個模組的預設輸出必須是 `{ name, setup }`；`setup` 內只允許宣告式掛件，例如 `stores`、`routes`、`ui`。
- `moduleDiscovery.js` 只負責取得宣告模組名單，不得執行模組安裝。
- `boot.js` 只負責 `discover -> visibility resolve -> install -> enter runtime`；不得跳過 `modules/index.js` 直接安裝單一模組。

### Layout And Route Resilience
- `LayoutRoot.vue` 必須是可降級容器，不得把任一模組 store、route 或 capability 視為永久存在。
- page / component 若依賴其他模組能力，必須先做存在檢查；缺席時只能降級顯示或隱藏能力，不得報錯。
- 導航顯示必須依已註冊 route 或 `meta.nav` 投影，不得硬寫成「所有模組永遠都在」。
- 移除任一非核心模組時，shell 必須仍可載入，且該模組的導航入口必須同步消失。

### Project Services Hard Boundary
- project-level `services/` 不得直接提供 module-specific business API。
- 若函式名稱、request shape、response shape 或 state shape 已帶有模組語意，必須回到該模組自己的 `service.js` 或 `api/`。
- project-level `services/` 只能承載無模組語意能力，例如 transport、auth facade、repository primitive、pure shared transform。
- project-level `services/` 不得持有模組私有 state，也不得聚合多個模組流程成跨模組業務中心。

### Store And API Boundary
- `world.store` 只承載前端執行期狀態，不得被當成共享事實來源。
- 模組 `service.js` 負責流程協調，不得成為隱藏的長期 state center。
- 模組 `api/` 或 backend/mock API 才是共享真相的交換邊界。
- 若資料需要跨頁、跨角色、跨模組保持一致，必須建模為 API truth，而不是 store truth。
