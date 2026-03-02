# Convention Template

Title: Module Registry Boot Pipeline
Status: candidate
Scope: platform
Statement:
- project 層級的 `projects/<project>/modules/index.js` 是模組收集與安裝的唯一入口。
- `modules/index.js` 只負責四件事：收集模組 loader、載入模組、列出模組名單、依 allowList 安裝模組。
- 每個模組的預設輸出必須是 `{ name, setup }`；`setup` 內只允許宣告式掛件，例如 `stores`、`routes`、`ui`。
- `moduleDiscovery.js` 只負責取得「有哪些模組被宣告」；不得執行模組安裝。
- `boot.js` 只負責：discover -> visibility resolve -> install -> enter runtime；不得跳過 `modules/index.js` 直接安裝單一模組。
- 模組 routes 的合法掛入路徑必須是：模組 `routes` -> `register.routes()` -> `window.__MODULE_ROUTES__` bucket -> `buildRoutes()` / router。
- 模組 stores 的合法掛入路徑必須是：模組 `stores` -> `register.store()` -> container。
- 模組 UI slot 的合法掛入路徑必須是：模組 `ui.slots` -> `world.registerUISlot()`。
Evidence:
- `projects/project-b/modules/index.js`
- `projects/moduleDiscovery.js`
- `projects/modulesRegistry.js`
- `src/app/boot/boot.js`
- `src/app/container/register.js`
- `src/router/routes.js`
When to Promote:
- 之後新增專案仍沿用相同模組收集、安裝、route bucket 與 boot 流程。
- 再次驗證模組 contract 與 boot pipeline 在多個專案下都一致成立。
When to Demote:
- 若未來平台改用不同的 module manifest / runtime provider 機制，且 `modules/index.js` 不再是唯一入口。
Exceptions:
- 經正式提案核准的 runtime 重構，且新機制已明確取代 `modules/index.js -> boot -> register` 這條鏈。
Notes:
- `modules/index.js` 是 registry，不是控制中心；不得在此檔案執行業務流程。
- `listModules()` 的責任是回傳可被發現的模組名稱，不是載入模組內容。
- `installModules()` 的責任是做宣告式掛載，不是做初始化、副作用或登入判定。
- `boot()` 做可見性裁決後才安裝 allowList，代表「可見」與「已安裝」不是同一件事。
- `register.routes()` 會做 access meta 驗證、route flatten 與 bucket 掛入；模組不得自行繞過這層直接改 router root children。

Pipeline:
1. `world.start()` 載入 project config，呼叫 `boot({ projectConfig })`
2. `boot()` 呼叫 `discoverModules(projectConfig)`
3. `discoverModules()` 經 `@project/modules/index.js` 的 `listModules()` 取得宣告模組名單
4. `boot()` 依 `authStore` 與 `resolveWorldVisibility()` 算出 `allowList`
5. `boot()` 呼叫 `registry.installModules({ register }, { allowList })`
6. `installModules()` 載入 allowList 模組，將 `stores/routes/ui` 掛入 register facade
7. `register.routes()` 將模組 route 寫入 `window.__MODULE_ROUTES__`
8. `createAppRouter()` / `buildRoutes()` 讀取 route bucket，組成 root children
9. `enterRuntime()` 將 allowList 寫入 `moduleStore`，標記 lifecycle ready

Violation Signals:
- `boot.js` 直接 import 某個模組並安裝，繞過 `@project/modules/index.js`
- 模組直接操作 container、router root children 或 `window.__MODULE_ROUTES__`
- `modules/index.js` 開始承擔登入、資料抓取、初始化副作用等流程控制
- 模組 default export 不再提供穩定的 `{ name, setup }` contract
