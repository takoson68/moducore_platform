# dineCore Staff Auth 方案 B 實作計畫書

## 1. 文件目的

本文件用於定義 `dineCore` staff 後台採用「方案 B：中度整理方案」時的實作計畫與修改清單。

本階段目標不是導入平台級 Auth Guard，也不是改成 app boot + router 全域 guard，而是收斂 `dineCore` project-level staff auth，使其具備：

- 明確三態 auth facade：`checking / guest / auth`
- 單一 staff auth UI guard 入口
- page 不再承擔 auth 初始化責任
- layout 成為唯一 staff auth orchestration 容器

本文件只定義「要怎麼改」，不包含任何程式碼實作。

---

## 2. 方案 B 目標狀態

### 2.1 目標模型總覽

方案 B 完成後，`dineCore` staff auth 應呈現以下結構：

- `dineCoreStaffAuthService`
  - staff auth 唯一 facade
  - 對外提供正式三態狀態
  - 只負責 session restore / login / logout / role context / bootstrap 去重
- `LayoutRoot.vue`
  - staff auth 唯一 UI guard 容器
  - 根據 auth 三態決定：
    - `checking` 顯示 mask
    - `guest` 顯示 login panel
    - `auth` 顯示 staff shell
- `StaffAuthPanel.vue`
  - 純 guest login UI
  - 不負責 checking 判斷
  - 不負責 route orchestration
- staff pages
  - 不再主動 `bootstrap()`
  - 不再決定是否顯示 login
  - 只在 auth 完成後執行自己的資料載入
- `dineCoreStaffShellService`
  - 保留 staff route access / nav / landing path 判斷
  - 不持有 auth init 邏輯
  - 不負責 session restore

### 2.2 auth 狀態模型

目前 repo 已有可沿用基礎：

- `session`
- `initialized`
- `isBootstrapping`

方案 B 建議正式表達為：

- `checking`
  - 尚未完成 staff session restore / validate
- `guest`
  - restore 已完成，確認未登入
- `auth`
  - restore 已完成，且已取得 staff session

建議 service 對外至少能提供：

- `status`
- `isChecking`
- `isGuest`
- `isAuthenticated`
- `session`
- `currentRole`
- `isSuperAdmin`
- `bootstrap()`
- `signIn()`
- `signOut()`

### 2.3 auth 狀態轉移規則

方案 B 實作時，除三態本身外，還必須明確定義狀態轉移規則，避免後續在 login / logout / bootstrap / restoreSession 時出現不一致行為。

建議規格如下：

- 初始：
  - `status = checking`

- bootstrap 成功且取得 session：
  - `checking -> auth`

- bootstrap 成功但無 session：
  - `checking -> guest`

- bootstrap 失敗：
  - `checking -> guest`
  - 可記錄 `errorMessage` 或診斷訊息，但不可停留在無限 checking

- login 成功：
  - `guest -> auth`

- login 失敗：
  - `guest -> guest`
  - 更新 `errorMessage`

- logout 成功：
  - `auth -> guest`

- logout 失敗：
  - `auth -> auth`
  - 更新 `errorMessage`

- bootstrap 進行中若再次重入：
  - 不可重複建立新的 session restore 流程
  - 應共用既有 in-flight promise 或直接返回既有 bootstrap 結果
  - `status` 維持 `checking`，直到本次 bootstrap 完成

- auth 狀態下 route 切換：
  - 不應因 page mount 再次進入 `checking`
  - 除非明確執行 logout、hard refresh、或重新進入新的 staff shell 啟動流程

此規則的目的，是讓 `dineCoreStaffAuthService` 成為單一、可預期的 auth 狀態機，而不是只提供一組零散布林值。

### 2.4 bootstrap 應只在哪裡發生

bootstrap 只應在 staff shell 入口發生一次。

目前最適合的位置仍是：

- `platform/frontend/projects/dineCore/layout/LayoutRoot.vue`

不應再由各 staff page 自己重複執行。

### 2.5 頁面資料載入應在哪個階段執行

staff page 的資料載入應發生在：

- auth 狀態已確認為 `auth` 之後

不應發生在：

- `checking`
- page 自己還在等待 bootstrap 的階段
- login panel 顯示流程內

另外必須補充一條強制邊界：

- page 只可在已確認 `auth` 狀態後觸發自己的資料載入
- page 不可再次承擔 auth 初始化
- page 不可再次承擔 login 顯示判斷
- page 不可再次承擔 bootstrap 重試
- page 不可再次承擔 guest 導向決策

也就是說，page 可以依 `auth` 結果決定是否載入自己的資料，但不能重新參與 `checking -> guest -> auth` 的 orchestration。

---

## 3. 現況與目標差異分析

### 3.1 目前可沿用的部分

以下內容已部分符合方案 B，可沿用：

1. `platform/frontend/projects/dineCore/services/dineCoreStaffAuthService.js`
   - staff auth 已集中在 project-level service
   - 沒有再以 module 身分存在
   - 已有 `session / initialized / isBootstrapping / errorMessage`

2. `platform/frontend/projects/dineCore/layout/LayoutRoot.vue`
   - 已有 staff shell 與 guest login panel 切換
   - 已有 checking mask
   - 已在 staff route 進入時呼叫 `staffAuth.bootstrap()`

3. `platform/frontend/projects/dineCore/components/StaffAuthPanel.vue`
   - 已是獨立登入元件
   - 可作為 guest login UI 直接沿用

4. `platform/frontend/projects/dineCore/services/dineCoreStaffShellService.js`
   - 已集中 role / route access / landing path 判斷
   - 可保留為 shell orchestration service

### 3.2 目前與方案 B 的主要差距

1. auth 狀態仍是隱含推導
   - 目前是 `initialized + isBootstrapping + session`
   - 還不是正式對外宣告的三態模型

2. layout 與 page 重複 bootstrap
   - `LayoutRoot.vue` 已做一次
   - `DashboardPage.vue`
   - `ReportsPage.vue`
   - `TableAdminPage.vue`
   - `AuditClosePage.vue`
   - 以上頁面仍各自 `await staffAuth.bootstrap()`

3. 部分 page 仍承擔 auth 初始化責任
   - page 不只在等 auth 結果，還直接參與 auth 啟動

4. staff auth guard 還不是單一入口
   - 目前 UI 上主要在 layout
   - 但 page 仍會自己看 `isAuthenticated` 並觸發初始化

5. router guard 沒有真正接手 staff auth
   - 現有 staff routes 多數是 `meta.access = { public: true, auth: true }`
   - `platform/frontend/src/router/guards.js` 對 staff route 幾乎不起保護作用
   - 本階段不應處理，但必須明確知道現況

### 3.3 staff page 實際現況補充

目前 staff page 可分成兩類：

#### A. 已直接耦合 `useDineCoreStaffAuth()` 並重複 bootstrap 的 page
- `platform/frontend/projects/dineCore/modules/dashboard/pages/DashboardPage.vue`
- `platform/frontend/projects/dineCore/modules/reports/pages/ReportsPage.vue`
- `platform/frontend/projects/dineCore/modules/table-admin/pages/TableAdminPage.vue`
- `platform/frontend/projects/dineCore/modules/audit-close/pages/AuditClosePage.vue`

#### B. 目前未自行 bootstrap、主要仰賴 layout 保護的 page
- `platform/frontend/projects/dineCore/modules/visitor-stats/pages/VisitorStatsPage.vue`
  - 使用 `useDineCoreStaffAuth()`，但沒有自己 `bootstrap()`
  - 只讀 `isSuperAdmin`
- `platform/frontend/projects/dineCore/modules/counter/pages/CounterOrdersPage.vue`
- `platform/frontend/projects/dineCore/modules/counter/pages/CounterOrderDetailPage.vue`
- `platform/frontend/projects/dineCore/modules/kitchen/pages/KitchenBoardPage.vue`
- `platform/frontend/projects/dineCore/modules/menu-admin/pages/MenuAdminPage.vue`

結論：
staff page 不只四個；其中真正要優先整理的是第一類。

---

## 4. 修改策略總覽

### 4.1 核心策略

方案 B 的策略不是重做 auth 系統，而是收斂責任：

1. auth facade 三態化
2. layout guard 單一化
3. page auth 初始化移除
4. shell / role / page load 時機整理

### 4.2 實作邊界

本階段只動 `dineCore` project-level staff auth 相關責任，不碰：

- platform-level `authStore`
- platform-level `tokenStore`
- app boot phase
- router global guard
- 雙軌 auth 合併
- core/world 規則

### 4.3 調整原則

- auth 初始化只能有一個入口
- UI guard 只能有一個主容器
- page 不得再自己啟動 auth
- page 只負責自身資料載入
- role / route fallback 保留在 shell service
- login panel 保持純 UI 元件

---

## 5. 修改清單

### 5.1 必要修改

#### 1. `platform/frontend/projects/dineCore/services/dineCoreStaffAuthService.js`
- 目前責任：
  - session / login / logout / bootstrap / error state
- 目標責任：
  - staff auth 唯一 facade
  - 對外提供正式三態 auth 狀態
  - bootstrap 去重與狀態一致化
- 建議修改內容：
  - 明確定義 `status`
  - 對外輸出 `isChecking / isGuest / isAuthenticated`
  - 把目前隱含推導正式收斂成 facade API
- 修改類型：必要
- 風險等級：中

#### 2. `platform/frontend/projects/dineCore/layout/LayoutRoot.vue`
- 目前責任：
  - guest / staff shell 切換
  - staff auth mask / login panel / shell 顯示
  - nav / fallback redirect / guest shell orchestration
- 目標責任：
  - staff auth 唯一 UI guard 容器
- 建議修改內容：
  - 只依 auth facade 三態判斷 staff UI
  - 讓 bootstrap 只在這裡發生
  - staff shell 顯示條件與 guest login panel 顯示條件全面對齊三態
- 修改類型：必要
- 風險等級：中

#### 3. `platform/frontend/projects/dineCore/components/StaffAuthPanel.vue`
- 目前責任：
  - staff login UI
- 目標責任：
  - 純 guest login UI
- 建議修改內容：
  - 不碰 checking 判斷
  - 不持有額外 route / bootstrap 決策
  - 僅保留登入送出與 error 呈現
- 修改類型：必要
- 風險等級：低

#### 4. `platform/frontend/projects/dineCore/modules/dashboard/pages/DashboardPage.vue`
- 目前責任：
  - page data load
  - 自行 bootstrap auth
- 目標責任：
  - 只在 auth 已完成後載入 dashboard data
- 建議修改內容：
  - 移除 `onMounted -> await staffAuth.bootstrap()`
  - 保留 auth 狀態觀察，但不再承擔初始化
- 修改類型：必要
- 風險等級：中

#### 5. `platform/frontend/projects/dineCore/modules/reports/pages/ReportsPage.vue`
- 目前責任：
  - page data load
  - 自行 bootstrap auth
- 目標責任：
  - 只在 auth 完成後載入 reports data
- 建議修改內容：
  - 移除 page-level bootstrap
  - 保留 filters 與 auth 後資料載入邏輯
- 修改類型：必要
- 風險等級：中

#### 6. `platform/frontend/projects/dineCore/modules/table-admin/pages/TableAdminPage.vue`
- 目前責任：
  - page data load
  - 自行 bootstrap auth
- 目標責任：
  - 只在 auth 完成後載入 tables data
- 建議修改內容：
  - 移除 page-level bootstrap
  - 保留 `hasLoadedOnce` 類型的資料載入保護
- 修改類型：必要
- 風險等級：中

#### 7. `platform/frontend/projects/dineCore/modules/audit-close/pages/AuditClosePage.vue`
- 目前責任：
  - page data load
  - 自行 bootstrap auth
- 目標責任：
  - 只在 auth 完成後載入 audit-close data
- 建議修改內容：
  - 移除 page-level bootstrap
  - 保留 selectedDate 變動後的資料重載
- 修改類型：必要
- 風險等級：中

#### 8. `platform/frontend/projects/dineCore/services/dineCoreStaffShellService.js`
- 目前責任：
  - route access / nav items / landing path
- 目標責任：
  - 純 shell route / role projection service
- 建議修改內容：
  - 確認只在 auth 完成後被 layout 使用
  - 不新增 bootstrap / session restore 行為
- 修改類型：必要
- 風險等級：低

### 5.2 建議修改

#### 9. `platform/frontend/projects/dineCore/modules/visitor-stats/pages/VisitorStatsPage.vue`
- 目前責任：
  - 依 `isSuperAdmin` 決定是否載入資料
- 目標責任：
  - 與方案 B 的 auth facade 表達方式一致
- 建議修改內容：
  - 檢查是否需要改用正式 `status + isSuperAdmin` 判斷
  - 目前可沿用，不是優先阻塞點
- 修改類型：建議
- 風險等級：低

#### 10. staff routes
- 涉及檔案：
  - `platform/frontend/projects/dineCore/modules/dashboard/routes.js`
  - `platform/frontend/projects/dineCore/modules/counter/routes.js`
  - `platform/frontend/projects/dineCore/modules/kitchen/routes.js`
  - `platform/frontend/projects/dineCore/modules/reports/routes.js`
  - `platform/frontend/projects/dineCore/modules/visitor-stats/routes.js`
  - `platform/frontend/projects/dineCore/modules/menu-admin/routes.js`
  - `platform/frontend/projects/dineCore/modules/table-admin/routes.js`
  - `platform/frontend/projects/dineCore/modules/audit-close/routes.js`
- 目前責任：
  - staff role / superAdminOnly meta 標記
- 目標責任：
  - 保持 route meta 只描述權限，不負責 auth boot
- 建議修改內容：
  - 本階段主要是檢查與註記，不必大改
- 修改類型：建議
- 風險等級：低

### 5.3 選配修改

#### 11. `platform/frontend/projects/dineCore/api/staffSessionApi.js`
- 目前責任：
  - session/login/logout API 邊界
- 目標責任：
  - 提供穩定 restore / validate 語意
- 建議修改內容：
  - 若 auth facade 三態化後需要更乾淨的命名，可做 API 邊界語意整理
- 修改類型：選配
- 風險等級：低

#### 12. `platform/frontend/projects/dineCore/modules/counter/pages/CounterOrdersPage.vue`
#### 13. `platform/frontend/projects/dineCore/modules/counter/pages/CounterOrderDetailPage.vue`
#### 14. `platform/frontend/projects/dineCore/modules/kitchen/pages/KitchenBoardPage.vue`
#### 15. `platform/frontend/projects/dineCore/modules/menu-admin/pages/MenuAdminPage.vue`
- 目前責任：
  - page data load，仰賴 layout 保護
- 目標責任：
  - 與方案 B 的 page 邏輯一致
- 建議修改內容：
  - 本階段先檢查是否需要補 auth 狀態保護
  - 若 layout guard 已穩定，可暫不改
- 修改類型：選配
- 風險等級：低到中

---

## 6. 分階段實作計畫

### Phase 1：auth facade 三態化

#### 目標
將 `dineCoreStaffAuthService` 從「可用狀態集合」整理成正式三態 auth facade。

#### 涉及檔案
- `platform/frontend/projects/dineCore/services/dineCoreStaffAuthService.js`
- `platform/frontend/projects/dineCore/api/staffSessionApi.js`（必要時）

#### 預計改動內容
- 正式定義 auth 狀態模型
- 正式定義 auth 狀態轉移規則
- 明確對外提供三態相關 getter
- 明確 `bootstrap()` 的去重與狀態轉移規則
- 保持登入 / 登出 / 錯誤狀態一致

#### 驗收標準
- service 可明確區分 `checking / guest / auth`
- bootstrap 在同一時段內不會重複打 session restore
- layout 與 page 不需要再自行組合狀態推導

#### 回歸風險
- login / logout 後狀態轉換錯誤
- 初始化後 `guest/auth` 判斷不同步

### Phase 2：layout guard 收斂

#### 目標
讓 `LayoutRoot.vue` 成為唯一 staff auth UI guard 容器。

#### 涉及檔案
- `platform/frontend/projects/dineCore/layout/LayoutRoot.vue`
- `platform/frontend/projects/dineCore/components/StaffAuthPanel.vue`
- `platform/frontend/projects/dineCore/services/dineCoreStaffShellService.js`

#### 預計改動內容
- layout 只讀 auth facade 三態
- checking 顯示 mask
- guest 顯示 login panel
- auth 顯示 staff shell
- bootstrap 只在 layout staff 入口發生一次

#### 驗收標準
- 已登入進 staff route 時，不再看到 login panel 閃現
- checking 期間不顯示 staff shell 與 login panel 混合畫面
- guest 期間只顯示 login panel
- auth 期間只顯示 staff shell

#### 回歸風險
- layout route 切換時狀態切換不連續
- mobile menu / fallback redirect 被不小心影響

### Phase 3：staff pages 移除重複 bootstrap

#### 目標
移除各 staff page 的 auth 初始化責任。

#### 涉及檔案
- `platform/frontend/projects/dineCore/modules/dashboard/pages/DashboardPage.vue`
- `platform/frontend/projects/dineCore/modules/reports/pages/ReportsPage.vue`
- `platform/frontend/projects/dineCore/modules/table-admin/pages/TableAdminPage.vue`
- `platform/frontend/projects/dineCore/modules/audit-close/pages/AuditClosePage.vue`

#### 預計改動內容
- 刪除 page-level `await staffAuth.bootstrap()`
- page 只保留 auth 完成後的 data load
- page 僅依 auth facade 狀態判斷是否載入資料
- page 不再監聽完整 auth 流程來參與登入 orchestration

#### 驗收標準
- staff route 切換時不再因 page mount 重複 bootstrap
- page 仍能在 auth 成功後正常載入資料
- page 不再參與 login / checking UI 決策
- page 不再承擔 bootstrap 重試、guest 導向或 login 顯示判斷

#### 回歸風險
- 首次進入 page 後資料未載入
- 某些 page 依賴 `onMounted bootstrap` 的副作用被移除後出現空資料

### Phase 4：shell / role / page load 時機整理

#### 目標
整理 shell 與 role access 的使用時機，讓 auth 完成後才進行 route access / nav projection / landing redirect。

#### 涉及檔案
- `platform/frontend/projects/dineCore/layout/LayoutRoot.vue`
- `platform/frontend/projects/dineCore/services/dineCoreStaffShellService.js`
- staff routes 檔案（只檢查與對齊，不做大改）

#### 預計改動內容
- 確保 role access 與 landing path 在 auth 完成後執行
- 確保 `staffRoles` / `superAdminOnly` 的使用責任仍留在 shell 層
- 不新增 router global guard

#### 驗收標準
- role 不符的 staff 使用者仍能被正確導回合法 landing path
- super admin page 仍只對 super admin 生效
- nav items 呈現與 route access 判斷一致

#### 回歸風險
- route fallback redirect 錯誤
- 某些 staff route 在 auth 完成前被過早判斷

---

## 7. 驗收清單

### 7.1 auth UI 與狀態驗收

- 已登入使用者進 staff route 時，不再看到 login panel 閃現
- checking 期間只顯示 mask
- guest 狀態只顯示 login panel
- auth 狀態只顯示 staff shell

### 7.2 bootstrap 與初始化驗收

- staff auth bootstrap 只在 staff shell 入口發生一次
- 每次 staff route 切換不再由各 page 重複 bootstrap
- 同一段 staff route 流程中，不會因 page mount 重複 session restore

### 7.3 page 責任驗收

- staff pages 不再自行決定登入流程
- page 只負責自己的資料載入
- page 資料只在 auth 完成後載入

### 7.4 role / shell 驗收

- `staffRoles` 與 `superAdminOnly` 仍有效
- role 不符時仍可導向合法 landing path
- staff nav 顯示與實際可進入 route 一致

### 7.5 回歸驗收

- login 成功後可正常進 staff shell
- logout 後會回到 guest login panel
- hard refresh 後仍能正確 restore staff session
- mock / real 模式都不應破壞 auth UI 流程

---

## 8. 風險與注意事項

### 8.1 主要風險

1. 雖然本階段不碰平台 auth，但底層仍存在雙軌 auth
   - `platform/frontend/src/app/stores/authStore.js`
   - `platform/frontend/src/app/stores/tokenStore.js`
   - `platform/frontend/projects/dineCore/services/dineCoreStaffAuthService.js`
   - 需明確把本階段 truth source 定在 project-level staff auth facade

2. 某些 page 目前看似沒有 auth service，但其實依賴 layout guard
   - `CounterOrdersPage.vue`
   - `CounterOrderDetailPage.vue`
   - `KitchenBoardPage.vue`
   - `MenuAdminPage.vue`
   - 不應在本階段順手擴大改動

3. `visitor-stats` 是特例
   - 它依 `isSuperAdmin` 決定是否載入資料
   - 雖未重複 bootstrap，但後續可能需要跟三態 facade 表達對齊

### 8.2 注意事項

- 本階段應優先解決責任收斂，不是功能擴張
- 不要把 role / permission 系統全面重寫
- 不要把 router meta 當成 auth boot 入口
- 不要讓 page 再次長回 auth orchestration 中心

---

## 9. 本階段不處理事項

本次方案 B 明確不處理以下範圍：

1. 不合併平台 auth 與 project auth
2. 不改 platform-level router global guard
3. 不改 app boot phase
4. 不把 `dineCore` auth 升格成 core 共用規則
5. 不做雙軌 auth 統一
6. 不做平台級權限系統全面重構
7. 不改 `_VibeCore/world/` 或 platform world/core 責任
8. 不以本次需求順手重構 counter / kitchen / menu-admin 全部 staff page
9. 不新增新的 auth module 身分
10. 不把 login panel 再往 page 層散回去

---

## 10. 建議實作順序總結

建議順序如下：

1. 先整理 `dineCoreStaffAuthService.js`
   - 正式三態化
   - bootstrap 去重規則明確化

2. 再收斂 `LayoutRoot.vue`
   - 作為唯一 staff auth UI guard
   - 明確對應 `checking / guest / auth`

3. 再移除四個主要 staff page 的重複 bootstrap
   - dashboard
   - reports
   - table-admin
   - audit-close

4. 最後整理 shell / role / landing path 時機
   - 確保 shell service 只在 auth 完成後使用
   - 不擴大到 platform-level guard

結論：
方案 B 最合理的落地方式，是先把 `dineCore` staff auth 收斂成「單一三態 facade + 單一 layout guard + page 純資料載入」模型。這樣能解決目前最核心的責任重複與 auth 初始化分散問題，同時不會過早碰到平台級 auth 合併風險。
