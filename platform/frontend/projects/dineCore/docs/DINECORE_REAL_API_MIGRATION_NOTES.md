# DINECORE_REAL_API_MIGRATION_NOTES

更新日期：2026-03-03

## 1. 用途

本文件整理 `dineCore` 從 mock runtime 遷移到正式後端 API 的順序與原則。

目標不是一次全部切換，而是：
- 先固定契約
- 再逐模組切換
- 避免把 project-level services 變成臨時業務中心

---

## 2. 邊界原則

遷移時必須維持：
- `world / store / api` 邊界不變
- 共享真相只能走 API 邊界
- 不可使用 project-level business service
- `LayoutRoot` 必須是可降級容器
- 頁面有資料就畫，沒資料就不畫

這代表：
- 只替換 module-local `api/*.js`
- 不得把真實 API 轉接集中到 `projects/dineCore/services/`

---

## 3. 建議切換順序

### Phase 1
- `staff-auth`
- `counter`
- `kitchen`

理由：
- 這三者先決定商家端工作流是否真能跑

### Phase 2
- `dashboard`
- `reports`
- `audit-close`

理由：
- 這三者依賴聚合資料與關帳規則
- 必須等訂單與付款主資料來源穩定後再切

### Phase 3
- `menu-admin`
- `table-admin`

理由：
- 管理端可在主流程穩定後切換

---

## 4. 契約文件入口

正式 API 遷移時優先依以下文件：

- [`DINECORE_REPORTS_API_CONTRACT.md`](/Users/zhangyu/Desktop/moducore_platform/platform/frontend/projects/dineCore/docs/DINECORE_REPORTS_API_CONTRACT.md)
- [`DINECORE_AUDIT_CLOSE_API_CONTRACT.md`](/Users/zhangyu/Desktop/moducore_platform/platform/frontend/projects/dineCore/docs/DINECORE_AUDIT_CLOSE_API_CONTRACT.md)
- 既有 [`DINECORE_M1_API_CONTRACT.md`](/Users/zhangyu/Desktop/moducore_platform/platform/frontend/projects/dineCore/docs/DINECORE_M1_API_CONTRACT.md)

---

## 5. 切換方式

每個模組切換時遵守：

1. 保留 module-local `api/`
2. 先讓 `api/*.js` 支援 real endpoint
3. 保留 `service.js` 作為 mapping 與錯誤翻譯層
4. `store.js` 與 page 不直接認識 backend shape

---

## 6. 風險提醒

目前 mock 已有的行為，正式後端不可漏掉：
- 顧客端 `ordering_session_token`
- `ordering_session_token` 必須綁在桌號下的未結單訂單，不是單純綁桌號
- 沒有 token 視為第一次進來，後端需先建立或取得這桌目前未結單訂單，再在該訂單下分配 `person_slot`
- 只要同一張訂單尚未結單，新進客人都應掛在同一張訂單下，不限制人數
- `reports` 的摘要與明細 shape
- `audit-close` 的歷史欄位
- `BUSINESS_DATE_LOCKED`
- `STAFF_ROLE_FORBIDDEN`

若後端少掉這些契約，前端雖然不一定會報 compile error，但行為會退化。

## 7. 顧客端正式 API 最低要求

正式後端至少要保證以下欄位存在：
- `entry/context`
  - `ordering_session_token`
  - `ordering_cart_id`
  - `person_slot`
  - `ordering_label`
  - `order_id`
  - `order_no`
  - `order_status`
- `cart/get`
  - `ordering_session_token`
  - `ordering_cart_id`
  - `person_slot`
  - `ordering_label`
- `cart/add-item`
  - request 必須接受 `ordering_session_token`
- `checkout/summary`
  - request 必須接受 `ordering_session_token`
- `checkout/submit`
  - request 必須接受 `ordering_session_token`

若正式 API 遺漏這些欄位，顧客端匿名身份鏈將無法穩定運作。
