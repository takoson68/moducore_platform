# DineCore Next Session Handoff

時間：2026-03-03 夜間收尾

## 今晚已完成

### 1. 顧客端正式後端已落地
- 已新增 `dineCore` 顧客端 backend route / controller：
  - `platform/backend/src/routes.php`
  - `platform/backend/src/Controllers/DineCoreGuestApiController.php`
- 已新增 `dineCore` 最小 schema / seed：
  - `platform/backend/sql/dinecore/001_dinecore_base.sql`
  - `platform/backend/sql/dinecore/002_dinecore_demo_seed.sql`
- 已完成顧客端 API 主鏈驗證：
  - `entry-context`
  - `menu`
  - `carts`
  - `cart/add-item`
  - `checkout-summary`
  - `checkout-submit`
  - `order-tracker`

### 2. staff-auth / reports / audit-close 正式後端已落地
- 已新增 staff backend route / controller：
  - `platform/backend/src/Controllers/DineCoreStaffApiController.php`
- 已新增 `dineCore` staff / 關帳資料表與 seed：
  - `platform/backend/sql/dinecore/003_dinecore_staff_auth_seed.sql`
- 已讓平台 `AuthController` 認得 `dineCore` staff profile
- 已完成 staff API 驗證：
  - `login`
  - `reports/summary`
  - `reports/orders`
  - `audit-close/summary`
  - `audit-close/close`
  - `audit-close/unlock`
  - `audit-close/history`

### 3. 前端已改成 real/mock 雙模
- 顧客端模組：
  - `entry`
  - `menu`
  - `cart`
  - `checkout`
  - `order-tracker`
- staff / 管理端模組：
  - `staff-auth`
  - `reports`
  - `audit-close`
- 共用 adapter：
  - `platform/frontend/projects/dineCore/api/dineCoreRequest.js`

### 4. 顧客 QR 入口錯誤暴增已做第一輪修正
- 問題不是單純「取不到編號」
- 根因是多個頁面同時重複打 `entry/context` 與 guest API，且使用 `watchEffect`
- 已改成：
  - `entryStore` 先建立 / 恢復 `ordering_session_token`
  - `menu / cart / checkout` 只跟著吃同一個 token
- 本輪修正檔案：
  - `platform/frontend/projects/dineCore/modules/entry/pages/EntryLandingPage.vue`
  - `platform/frontend/projects/dineCore/layout/LayoutRoot.vue`
  - `platform/frontend/projects/dineCore/modules/menu/pages/MenuPage.vue`
  - `platform/frontend/projects/dineCore/modules/cart/pages/CartPage.vue`
  - `platform/frontend/projects/dineCore/modules/checkout/pages/CheckoutPage.vue`

### 5. 最新 real-mode 前端產物
- 已發佈到：
  - `platform/backend/public/index.html`
  - `platform/backend/public/assets/index-3Nci7REJ.js`

## 目前狀態判斷
- `dineCore` 已經從「只有 mock 閉環」進到「顧客端 + reports/audit-close 局部 real API 閉環」
- 尚未切 real API 的主要模組：
  - `counter`
  - `kitchen`
  - `dashboard`

## 明天最合理的下一步
1. 先做真實畫面驗證，確認 QR 入口錯誤是否已消失。
2. 若 QR 入口仍有問題，先加暫時 debug 顯示：
   - `entry/context` 回應
   - `ordering_session_token`
   - 最後一次錯誤碼
3. 再開始 `counter / kitchen / dashboard` 正式 API 遷移。

## 明天進場前建議先讀
- `platform/frontend/projects/dineCore/docs/DINECORE_CURRENT_STATE.md`
- `platform/frontend/projects/dineCore/docs/DINECORE_PROGRESS_TRACKER.md`
- `platform/frontend/projects/dineCore/docs/DINECORE_ROADMAP.md`
- `platform/frontend/projects/dineCore/docs/DINECORE_GUEST_ORDERING_SESSION_BACKEND_HANDOFF.md`

## 直接貼給 Codex：匯入資料庫

```text
請先閱讀 _VibeCore/STARTUP_DECLARATION.md，並依其導引進入世界。

接著請幫我在這台電腦匯入 DineCore 資料庫，並完成最小驗證。

請依序執行：
1. 啟動本機 MAMP MySQL
2. 匯入以下 SQL 到 `moducore_platform`
   - `platform/backend/sql/dinecore/001_dinecore_base.sql`
   - `platform/backend/sql/dinecore/002_dinecore_demo_seed.sql`
   - `platform/backend/sql/dinecore/003_dinecore_staff_auth_seed.sql`
3. 驗證以下資料是否存在
   - `dinecore_tables`
   - `dinecore_menu_items`
   - `dinecore_orders`
   - `dinecore_guest_sessions`
   - `dinecore_staff_profiles`
   - `dinecore_business_closings`
   - `dinecore_business_closing_history`
4. 驗證 `dineCore` staff 帳號是否存在
   - `manager / manager123`
   - `deputy / deputy123`
   - `counter / counter123`
   - `kitchen / kitchen123`
5. 啟動 backend 後，驗證以下 API
   - `/api/dinecore/entry-context?table_code=A01`
   - `POST /api/login` with `X-Project: dineCore`
   - `/api/dinecore/staff/reports/summary`

完成後請回報：
- 匯入是否成功
- 哪些表已存在
- staff 帳號是否可登入
- API 是否可正常回應
```

## 直接貼給 Codex：接續工作

```text
請先閱讀 _VibeCore/STARTUP_DECLARATION.md，並依其導引進入世界。

請先閱讀以下文件，接續 DineCore 專案目前進度後再開始工作：
1. _workspace/DINECORE_NEXT_SESSION_HANDOFF.md
2. platform/frontend/projects/dineCore/docs/DINECORE_CURRENT_STATE.md
3. platform/frontend/projects/dineCore/docs/DINECORE_PROGRESS_TRACKER.md
4. platform/frontend/projects/dineCore/docs/DINECORE_ROADMAP.md
5. platform/frontend/projects/dineCore/docs/DINECORE_GUEST_ORDERING_SESSION_BACKEND_HANDOFF.md

接著先確認以下狀態：
- DineCore 顧客端 backend route / controller 已存在
- staff-auth / reports / audit-close backend 已存在
- 前端顧客端與 reports / audit-close 已支援 real/mock 雙模
- 最新 backend public bundle 是否為 real mode

然後先做這件事：
- 先驗證 QR 入口頁錯誤是否仍然持續增加

若錯誤仍存在，請直接定位：
- 是否仍有重複呼叫 entry/context
- 是否 ordering_session_token 在 entry / menu / cart / checkout 間漂移
- 是否某個 watcher 因 store 更新反覆觸發

若錯誤已消失，下一步改做：
- 開始規劃並實作 counter / kitchen / dashboard 的正式 API 遷移

補充原則：
- 必須遵守 world / store / api 邊界
- 共享真相只能走 API 邊界
- 不可使用 project-level business service
- LayoutRoot 必須是可降級容器
- 頁面有資料就畫，沒資料就不畫，不可因模組缺席報錯
```
