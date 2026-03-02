# FLOWCENTER_BACKEND_PLAN.md

## flowCenter 後端計畫書

---

## 0. 文件用途

本文件用於定義 `flowCenter` 後端 MVP 的實作邊界、資料隔離、權限規則、模組對齊方式與 Phase 驗收規則。

本文件聚焦於後端層，不處理前端 Demo 狀態；後端 Phase 進度必須由獨立的狀態檔管理。

---

## 1. 可行性判定

目前規劃可行，原因如下：

- 需求已收斂為 MVP 閉環，不包含額外流程引擎或擴充功能
- 核心邊界明確：`company_id` 隔離、角色權限、6 個模組對齊、Phase Gate
- 可直接沿用既有 auth/session/token 機制，不必先重寫平台核心
- 若既有機制不足，可在 `flowCenter` 後端範圍內補最小 middleware

---

## 2. 後端目標（MVP 閉環）

### 2.1 Employee

- 可建立請假申請
- 可查詢自己的請假清單與明細
- 可建立採購申請
- 可查詢自己的採購清單與明細

### 2.2 Manager

- 可在 approval 查看待審清單
- 可執行 `approve / reject`

### 2.3 Dashboard

- 提供聚合摘要 API
- 回傳 `counts + recent`

### 2.4 Announcement / Task

- `announcement` 提供最小 CRUD
- `task` 提供最小 CRUD

---

## 3. 強制規則（必做）

### 3.1 資料隔離

- 所有業務資料表都必須包含 `company_id`
- 所有 API 查詢必須以 `company_id` 做隔離
- 任一 request 若無法取得 `company_id`，必須直接拒絕

### 3.2 權限

- 所有 API 都必須做角色驗證
- 不可只依賴前端路由可見性
- `approval` API：`manager only`
- `leave/purchase` create / update：`employee only`

### 3.3 Approval 邊界限制

- `approval` 不得持有或定義業務狀態機
- `leave/purchase` 的狀態規則由各自 Controller / Model 定義
- `approvals` 只存 decision、comment、`source_type`、`source_id`

### 3.4 Phase Gate

- 每個 Phase 完成後都必須通過 build / migration / API 檢查
- 若驗收未通過，不得推進到下一個 Phase

---

## 4. DB Schema（最小）

### 4.1 共通欄位

所有業務表至少包含：

- `company_id`
- `created_at`
- `updated_at`

若平台既有命名或型別規則不同，可沿用既有風格，但不得省略 `company_id`。

### 4.2 業務表

- `leave_requests`
- `purchase_requests`
- `announcements`
- `tasks`
- `approvals`

### 4.3 表用途

#### leave_requests

- 儲存請假申請資料
- 狀態最小集合建議為：`submitted / approved / rejected`

#### purchase_requests

- 儲存採購申請資料
- 狀態規則與 leave 相同層級處理

#### announcements

- 儲存公告資料

#### tasks

- 儲存任務資料

#### approvals

- 僅儲存 decision 記錄
- 透過 `source_type` + `source_id` 指向來源資料
- 不持有來源業務主狀態

---

## 5. API 路由（最小）

### 5.1 Auth

- 若已有 auth/session API，優先沿用
- 必須可回傳：
  - `user_id`
  - `role`
  - `company_id`

### 5.1.1 Request Context 最小規格（必做）

每個 API request 必須可取得以下欄位，缺一拒絕：

- `user_id`
- `role`：`employee | manager`
- `company_id`

取得方式優先順序：

1. 沿用既有 `session/token`
2. 若無既有機制，僅允許在 `flowCenter` 後端新增最小 middleware，且不得改平台核心

所有 Controller 不得自行解析 token/session，必須從統一的 request context 取得上述欄位。

### 5.2 Leave

- `GET /leave`
  - 只能查自己的資料
- `GET /leave/{id}`
  - 只能查自己的資料
- `POST /leave`
- `PATCH /leave/{id}`
  - 需限制可修改欄位與狀態範圍

### 5.3 Purchase

- `GET /purchase`
  - 只能查自己的資料
- `GET /purchase/{id}`
  - 只能查自己的資料
- `POST /purchase`
- `PATCH /purchase/{id}`

### 5.3.1 Tenant Module Toggle（purchase）後端策略（必做）

- `company-b`：`purchase` 模組視為 disabled
- disabled 行為：
  - `purchase` 相關 API 一律回傳 `404`
  - 不允許透過參數繞過

### 5.4 Approval

- `GET /approval/pending`
  - `manager only`
  - 僅能看到同 `company_id` 內的待審資料
- `POST /approval/decide`
  - `approve / reject + comment + source`
  - 寫入 `approvals`
  - 由來源 Controller 套用狀態變更

### 5.5 Dashboard

- `GET /dashboard/summary`
  - 回傳 `counts + recent`

### 5.6 Announcement / Task

- `announcement`：最小 CRUD
- `task`：最小 CRUD
- 全部查詢都必須帶有 `company_id` 隔離

---

## 6. 開發階段

### Phase B0：基礎建置

- 建立 migration / SQL
- 建立 DB connection
- 建立 base response 格式
- 建立錯誤格式統一規則

### Phase B1：Auth 與 Request Context

- 解析 token / session
- 將 `company_id` / `role` / `user_id` 注入 request context
- 缺少 `company_id` 一律拒絕

### Phase B2：Leave + Purchase

- 完成最小 CRUD
- 實作 `company_id` 隔離
- 實作角色限制
- 實作 ownership 限制

### Phase B3：Approval

- 提供待審清單
- 提供 decide
- 寫入 approvals
- 更新 leave / purchase 狀態

### Phase B4：Dashboard 聚合

- counts
  - pending approvals
  - my requests
- recent
  - latest announcements
  - my tasks

### Phase B5：Announcement + Task

- 最小 CRUD
- 權限規則固定並寫死
- 例如：announcement publish 僅限 manager

---

## 7. 每階段驗收清單（必跑）

### 7.1 API 格式

- 成功/失敗回傳格式必須一致

### 7.1.1 API Response 統一格式（必做）

成功：

- `{ ok: true, data: <payload> }`

失敗：

- `{ ok: false, error: { code: <string>, message: <string> } }`

HTTP 狀態碼最低要求：

- `401`：未登入 / 無 token
- `403`：角色不符
- `404`：資源不存在，或 module disabled 採 `404` 策略時使用
- `422`：輸入驗證失敗
- `500`：未預期錯誤

### 7.2 company_id 隔離

- A token 不可查到 B 資料
- 不得跨 company 讀寫

### 7.3 權限

- `employee` 打 `approval` API 必須回 `403`
- 角色不符時必須拒絕

### 7.4 ownership

- `employee` 不可讀/改別人的 leave / purchase

### 7.5 Approval 邊界

- `approval` 只提交 decision
- `leave/purchase` 狀態變更必須由來源邏輯處理

---

## 8. Backend Phase Gate 規則

### 8.1 Gate 來源

- 後端 Phase 狀態以 `docs/BACKEND_PHASE_STATUS.md` 為唯一真實來源
- 每次執行前必須先讀取 `BACKEND_PHASE_STATUS`
- 只能執行 `Next Allowed Phase`
- 不得跳 Phase，也不得同時執行多個 Phase

### 8.2 更新規則

- 每完成一個 Phase，且驗收通過後，才可更新 `BACKEND_PHASE_STATUS`
- 必須更新：
  - `Current Phase`
  - `Next Allowed Phase`
  - `Phase Timeline`
- 若驗收未通過，不得推進下一個 Phase

### 8.3 Core Blocker 規則

- 若後端實作需要修改平台核心或共用核心機制，必須提出最小變更提案並停止
- 必須：
  - 將 `blockedByCore` 設為 `true`
  - 在 `Blockers` 寫入最小提案摘要
  - `Next Allowed Phase` 維持不變
  - 停止等待使用者確認

---

## 9. 完成定義（後端 MVP）

`flowCenter` 後端 MVP 視為完成，至少必須同時滿足：

- `company_id` 隔離已落地
- 角色權限已落地
- 6 個模組 API / DB 已對齊
- `approval` 未成為流程引擎
- 每個 Phase 都能驗收與回歸
- `BACKEND_PHASE_STATUS` 已完整更新

---

## Backend Phase 狀態檔案

- 後端狀態獨立管理於：`docs/BACKEND_PHASE_STATUS.md`
- 不與前端 `docs/PHASE_STATUS.md` 混用
