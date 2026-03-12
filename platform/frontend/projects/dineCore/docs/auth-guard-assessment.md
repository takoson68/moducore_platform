# Auth Guard 架構評估報告

## 1. 評估目的

本次評估目標是檢查 `dineCore` 員工後台目前的登入檢查流程，是否適合整理成三態式 Auth Guard：

- `checking`
- `guest`
- `auth`

並判斷應集中在單一 auth service / store / guard 機制，還是維持目前由 layout 與頁面分散判斷的方式。

---

## 2. 現況掃描結果

### 2.1 目前登入判斷發生在哪裡

目前登入判斷主要發生在三個地方：

1. `project-level auth service`
   - `platform/frontend/projects/dineCore/services/dineCoreStaffAuthService.js`
   - 持有 `session`、`initialized`、`isBootstrapping`、`isSubmitting`、`errorMessage`
   - `bootstrap()` 會呼叫 `getStaffSession()` 向後端確認 staff session

2. `layout 層`
   - `platform/frontend/projects/dineCore/layout/LayoutRoot.vue`
   - staff 路由進入時會先 `await staffAuth.bootstrap()`
   - 目前已在 layout 內做 staff 三態切換：
     - `showStaffAuthMask` = checking
     - `isStaffAuthenticated` = auth
     - 否則顯示 `StaffAuthPanel.vue` = guest

3. `頁面層`
   - 例如：
     - `platform/frontend/projects/dineCore/modules/dashboard/pages/DashboardPage.vue`
     - `platform/frontend/projects/dineCore/modules/reports/pages/ReportsPage.vue`
     - `platform/frontend/projects/dineCore/modules/table-admin/pages/TableAdminPage.vue`
     - `platform/frontend/projects/dineCore/modules/audit-close/pages/AuditClosePage.vue`
   - 這些頁面 `onMounted()` 時又會各自再呼叫一次 `await staffAuth.bootstrap()`
   - 並以 `staffAuth.isAuthenticated.value` 決定是否載入頁面資料

### 2.2 目前屬於哪一種流程型態

目前流程屬於：

- `layout 判斷 + 頁面局部判斷 + 少量 route meta 標記`
- 不是純 router guard
- 不是純 app boot guard
- 屬於混合式判斷

### 2.3 登入狀態來源是什麼

staff 後台目前實際依賴的是 project-level session：

- API 邊界：
  - `platform/frontend/projects/dineCore/api/staffSessionApi.js`
- service 狀態：
  - `platform/frontend/projects/dineCore/services/dineCoreStaffAuthService.js`

real API 模式下：

- `getStaffSession()` 會呼叫 `world.authApi().session()`
- `loginStaffSession()` 會呼叫 `world.authApi().login()`
- `logoutStaffSession()` 會呼叫 `world.authApi().logout()`

mock 模式下：

- 走 `platform/frontend/projects/dineCore/api/mockRequest.js` 的 `staff-auth/session` / `staff-auth/login` / `staff-auth/logout`

### 2.4 是否已有 store / container 可承接 auth 狀態

有，但目前 staff 後台沒有正式整合進去。

平台已有通用 auth 能力：

- `platform/frontend/src/app/stores/authStore.js`
- `platform/frontend/src/app/stores/tokenStore.js`
- `platform/frontend/src/app/stores/index.js`
- `platform/frontend/src/world.js`

這表示「可承接三態 auth store」的基礎是有的，但 `dineCore` staff auth 目前沒有直接掛成 container store，而是用 project-level singleton reactive service 承接。

### 2.5 是否已有 restore session / token 驗證流程

有，但分成兩條線：

1. 平台層有 token restore 能力
   - `platform/frontend/src/app/api/index.js`
   - `authApi.restoreSession()` 會讀 `tokenStore` 後打 `/api/session`

2. `dineCore` staff auth 有 session restore 能力
   - `platform/frontend/projects/dineCore/api/staffSessionApi.js`
   - `getStaffSession()` 直接向後端查 session

目前 `dineCore` 沒有在 app boot 階段主動執行 `restoreSession()`，而是在進 staff layout / page 時才做 `bootstrap()`。

### 2.6 localStorage / cookie / sessionStorage 使用方式

目前與 staff auth 直接有關的儲存方式：

- 平台 `authStore` 會用 `localStorage('auth')`
- 平台 `tokenStore` 會用 `localStorage('token')`
- store factory：
  - `platform/frontend/src/app/stores/_storeFactory.js`

但 `dineCoreStaffAuthService` 自己沒有直接讀寫 `localStorage`，它依賴 API 與記憶體狀態。

顧客流程另有自己的 localStorage，但與 staff auth 無直接關聯：

- `platform/frontend/projects/dineCore/api/guestOrderingSession.js`
- `platform/frontend/projects/dineCore/modules/cart/localCart.js`

### 2.7 是否存在多套登入方式

有兩套 auth 線：

1. 平台通用 auth
   - `platform/frontend/src/app/stores/authStore.js`
   - `platform/frontend/src/app/stores/tokenStore.js`
   - `platform/frontend/src/router/guards.js`
   - `platform/frontend/src/app/api/index.js`

2. `dineCore` staff project-level auth
   - `platform/frontend/projects/dineCore/api/staffSessionApi.js`
   - `platform/frontend/projects/dineCore/services/dineCoreStaffAuthService.js`
   - `platform/frontend/projects/dineCore/components/StaffAuthPanel.vue`
   - `platform/frontend/projects/dineCore/layout/LayoutRoot.vue`

結論：目前是雙軌 auth，不是單一來源。

---

## 3. 畫面閃爍問題成因分析

### 3.1 根本原因

根本原因不是單一「登入元件寫法」問題，而是登入確認責任沒有完整收斂。

原本 staff route 進入後，畫面層要先決定「顯示登入 UI 還是 staff shell」，但專案沒有明確、單一、全域的 auth status state。若先 render guest UI，再等待 session restore，已登入使用者就會看到登入元件短暫出現後又消失。

### 3.2 目前 repo 狀態

目前 `platform/frontend/projects/dineCore/layout/LayoutRoot.vue` 已經補上：

- `showStaffAuthMask`
- loading mask
- `isBootstrapping`

因此「進入 staff shell 時先顯示登入元件」這個表面問題，現在在 layout 層已經有初步修正。

### 3.3 仍存在的結構性問題

即使 layout 已有 mask，仍有幾個殘留問題：

1. `bootstrap()` 重複觸發
   - layout 一次
   - 多個 staff page 再各自一次

2. `checking / guest / auth` 不是正式 enum/state machine
   - 目前是用 `initialized + isBootstrapping + session` 組合推導
   - 可用，但語意仍偏隱含

3. router guard 沒有真正承接 staff auth
   - staff routes 的 `meta.access` 多數是 `{ public: true, auth: true }`
   - 在 `platform/frontend/src/router/guards.js` 這代表它們被視為 public，guard 不會擋 staff route

4. 權限判斷分散
   - route meta 有 `staffRoles` / `superAdminOnly`
   - shell service 也會判斷
   - page 自己也會看 `isAuthenticated`

結論：目前已解掉「顯示閃爍」，但 Auth Guard 架構仍未正式收斂。

---

## 4. 專案是否適合導入 Auth Guard

### 4.1 結論

適合，但建議分階段導入，不適合一步到位直接改成平台級完整 guard。

### 4.2 適合程度

- `Auth Checking Mask`：高
- `Auth Store 三態管理`：高
- `Layout 級保護`：高
- `Router Guard`：中
- `App 啟動時 restore session`：中
- `直接改成平台通用 auth 唯一來源`：中低

### 4.3 原因

適合的原因：

1. `dineCore` staff auth 已集中在 project-level service
   - 不是散在各模組 store
   - 這是好起點

2. staff shell 已集中在單一 layout
   - `platform/frontend/projects/dineCore/layout/LayoutRoot.vue`
   - 很適合做 layout-level guard，而不是每頁各寫一次

3. route meta 已有 staff role 資訊
   - 可作為後續 guard 的依據

4. 平台已有 store / token / router guard 基礎
   - 不需要從零開始

不適合直接上完整方案的原因：

1. 目前存在雙軌 auth
   - 平台 auth 與 project auth 尚未統一
2. router guard 現況與 staff routes meta 並不一致
3. boot phase 沒有正式 auth restore 階段
4. 若直接拉到 app boot，容易擴大改動範圍到整個平台

### 4.4 是否會破壞目前模組邊界

若採 project-level auth store / service + layout guard，基本不會破壞現有邊界。

理由：

- world / core 不需要被 project 商務語意反向污染
- `staff-auth` 已經不是 module，而是 project-level 能力
- 與現有 `模組哲學健檢書` 中的方向一致

若直接把 `dineCore` staff auth 強行塞回平台通用 auth store 當唯一真相，風險較高，因為會把 project-specific role/session 規則推回 core 層。

### 4.5 是否符合目前專案架構哲學

符合，但應以「project-level 收斂」為主，不應直接升格成平台共用規則。

最契合的做法是：

- `dineCore` 自己有單一 auth facade
- layout 與 staff pages 都只吃這個 facade
- router 僅做輔助性導向，不成為唯一事實來源

---

## 5. 可行導入方案比較

### 方案 A：最小改動方案

內容：

- 保留現有 `dineCoreStaffAuthService`
- 保留 layout 為主要入口
- 只正式化 `checking / guest / auth` 顯示邏輯
- 移除 staff pages 重複 `bootstrap()`，改由 layout 保證 auth 已完成

優點：

- 改動最小
- 風險最低
- 幾乎不碰 platform/core
- 最符合目前專案狀態

缺點：

- router guard 仍非主要 guard
- auth 真相仍偏 project-local
- 權限收斂有限

改動成本：

- 低

風險：

- 低

契合度：

- 高

### 方案 B：中度整理方案

內容：

- 將 `dineCoreStaffAuthService` 正式整理成三態 auth facade
- 明確提供 `status: 'checking' | 'guest' | 'auth'`
- layout 與 staff pages 統一只讀這個狀態
- staff pages 不再自行 `bootstrap()`
- shell service / page load 都依 auth status 決策

優點：

- 能真正收斂重複判斷
- 可明確解決 flicker 與重複 boot
- 不必大改平台層
- 後續若要接 router guard 比較順

缺點：

- 仍是 project-level，不是完整平台級 guard
- 需要整理現有 page lifecycle

改動成本：

- 中

風險：

- 中低

契合度：

- 最高

### 方案 C：完整 Auth Guard 方案

內容：

- app boot 時先 restore session
- router guard 接管 staff route 進入控制
- auth store 三態化
- layout 只負責呈現
- 後續可擴充 role / tenant / permission preload

優點：

- 結構最完整
- guard 責任最清楚
- 可擴充性最好

缺點：

- 需要處理平台 auth 與 `dineCore` project auth 的雙軌整合
- 可能碰到：
  - `platform/frontend/src/app/api/index.js`
  - `platform/frontend/src/router/guards.js`
  - `platform/frontend/src/app/boot/boot.js`
  - core auth/token stores
- 導入不慎會把 project-specific staff auth 污染到平台層

改動成本：

- 高

風險：

- 中高

契合度：

- 中

### 建議採用順序

建議順序：

1. 先做方案 A 或 B
2. 穩定後再評估是否需要 C
3. 不建議直接從現在跳到 C

---

## 6. 預計影響檔案與修改範圍

### 必要改動候選

1. `platform/frontend/projects/dineCore/services/dineCoreStaffAuthService.js`
   - 目前責任：staff session / login / logout / bootstrap / 錯誤狀態
   - 建議方向：正式化三態 auth 狀態、集中 bootstrap 去重、提供統一 guard API
   - 必要性：必要

2. `platform/frontend/projects/dineCore/layout/LayoutRoot.vue`
   - 目前責任：guest/staff shell、導航、登入面板切換、staff route orchestration
   - 建議方向：作為 staff auth guard 的主要 UI 容器；只依 auth status 切換畫面
   - 必要性：必要

3. `platform/frontend/projects/dineCore/components/StaffAuthPanel.vue`
   - 目前責任：登入表單 UI
   - 建議方向：只保留 guest login UI，不再參與 checking 判斷
   - 必要性：必要

4. staff pages
   - `platform/frontend/projects/dineCore/modules/dashboard/pages/DashboardPage.vue`
   - `platform/frontend/projects/dineCore/modules/reports/pages/ReportsPage.vue`
   - `platform/frontend/projects/dineCore/modules/table-admin/pages/TableAdminPage.vue`
   - `platform/frontend/projects/dineCore/modules/audit-close/pages/AuditClosePage.vue`
   - 目前責任：頁面資料載入 + 再次 bootstrap auth
   - 建議方向：移除重複 auth bootstrap，改為假設 layout 已完成 guard；頁面只在 `auth` 狀態後載資料
   - 必要性：必要

5. `platform/frontend/projects/dineCore/services/dineCoreStaffShellService.js`
   - 目前責任：staff route access、nav items、landing path
   - 建議方向：保留 role/path 判斷，但改由 auth status 完成後再使用
   - 必要性：必要

### 選配改動候選

6. `platform/frontend/projects/dineCore/api/staffSessionApi.js`
   - 目前責任：staff session/login/logout API 邊界
   - 建議方向：補明確 restore/validate 語意；可維持現狀
   - 必要性：選配

7. `platform/frontend/src/router/guards.js`
   - 目前責任：平台通用 auth/public route 判斷
   - 建議方向：若要導入 router guard，需先修正 staff routes meta 與平台 auth 使用方式
   - 必要性：選配

8. `platform/frontend/src/app/api/index.js`
   - 目前責任：平台 auth/token API 與 401 行為
   - 建議方向：若要統一平台 auth 與 project auth，才需要動
   - 必要性：選配

9. `platform/frontend/src/app/boot/boot.js`
   - 目前責任：boot 模組、visibility、runtime ready
   - 建議方向：若要做 app boot restore session，才需要新增 auth restore phase
   - 必要性：選配

10. `platform/frontend/src/main.js`
    - 目前責任：`await world.start()` 後直接 mount
    - 建議方向：若要讓 app mount 前先完成 auth restore，才需要調整
    - 必要性：選配

---

## 7. 風險與邊界評估

### 主要風險

1. 雙軌 auth 混用
   - 平台 `authStore/tokenStore`
   - project `dineCoreStaffAuthService`
   - 若沒有先定義誰是 truth source，很容易越改越亂

2. router guard 與 staff route meta 不一致
   - 現在多數 staff routes 是 `public: true, auth: true`
   - 對平台 router guard 而言等於 public route
   - 若直接上 router guard，會先碰到語意衝突

3. page 與 layout 重複 bootstrap
   - 容易造成流程難追、責任不清

4. 若把 staff auth 過度平台化
   - 可能破壞 project-level 邊界
   - 與目前世界觀中「project-specific auth 能力在 project 層收斂」不一致

### 邊界判斷

目前更適合：

- `layout guard + project-level auth facade`

暫時不建議直接改成：

- `platform-level global auth guard`

原因是 `dineCore` staff auth 有明顯 project-specific session / role / shell 邏輯。

---

## 8. 建議採用方案

建議採用：**方案 B：中度整理方案**

理由：

1. 已有 project-level auth facade，可直接演化
2. layout 已天然是 staff shell 入口
3. 可以最小範圍內把三態 auth 變成正式結構
4. 能收斂目前最明顯的重複 bootstrap 與分散判斷
5. 不需要立刻碰 core/world/router 的大範圍邏輯

---

## 9. 建議實作順序

1. 先定義 `dineCore` staff auth 唯一狀態模型
   - `checking`
   - `guest`
   - `auth`

2. 讓 `platform/frontend/projects/dineCore/services/dineCoreStaffAuthService.js` 成為唯一 bootstrap 入口
   - 只在 staff shell 入口做 restore / validate
   - 頁面不再各自 bootstrap

3. 讓 `platform/frontend/projects/dineCore/layout/LayoutRoot.vue` 成為唯一 staff auth UI guard
   - checking 顯示 mask
   - guest 顯示登入元件
   - auth 顯示 staff shell

4. staff pages 改為只處理自己的資料載入
   - 不再決定登入流程
   - 只在 auth 完成後載入 module data

5. 最後再評估是否要把 route meta 與 router guard 對齊
   - 這一步應該晚於 project-level auth 收斂
   - 不應先做

---

## 10. 暫不建議直接修改的原因（如果有）

暫不建議直接做完整 platform-level Auth Guard，原因如下：

1. 目前 staff auth 與平台 auth 是雙軌
2. staff routes 的 meta 與平台 router guard 語意不一致
3. app boot 還沒有明確 auth restore phase
4. 若直接全域化，容易把 `dineCore` staff-specific 邏輯錯誤提升到 core/platform 層

因此，較合理的過渡方案是：

- 先在 `dineCore` project 層完成三態 auth 收斂
- 再視實際成果決定是否需要上升到 router/app boot 層

---

## 結論摘要

目前專案 **適合導入 Auth Guard 概念**，但最適合的落點不是直接做平台級完整 guard，而是：

- 以 `dineCoreStaffAuthService` 為唯一 auth facade
- 以 `LayoutRoot.vue` 為主要 guard UI 容器
- 正式收斂成 `checking / guest / auth` 三態
- 移除各頁重複 `bootstrap()` 的局部判斷

也就是說，這個專案 **適合先做「layout-level 的集中三態 Auth Guard」**，而不是立刻做「app boot + router 全域 Auth Guard」。
