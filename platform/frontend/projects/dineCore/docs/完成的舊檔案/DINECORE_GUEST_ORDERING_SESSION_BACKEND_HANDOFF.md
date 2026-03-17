# DINECORE_GUEST_ORDERING_SESSION_BACKEND_HANDOFF

日期：2026-03-03

## 1. 用途
本文件提供 `dineCore` 顧客端匿名點餐身份鏈給正式後端實作時的最低落地要求。

目前前端與 mock 已完成：
- `ordering_session_token` 已作為顧客端匿名識別
- token 作用域為「桌號下的未結單訂單」
- `entry / menu / cart / checkout` 已顯式傳遞 token

後端需依此文件補齊正式 API。

## 2. 後端必做規則

### 2.1 首次進入
- 顧客掃碼進桌號後，request 可能沒有 `ordering_session_token`
- 後端必須先找該桌目前未結單訂單
- 若沒有未結單訂單，先建立新的 `order_id / order_no`
- 再於該訂單下建立新的匿名 ordering session

### 2.2 後續操作
- 只要 request 帶有效 `ordering_session_token`
- 後端就必須恢復同一匿名身份
- 不可重新分配新的 `person_slot`

### 2.3 同桌新客人
- 只要該桌目前仍有未結單訂單
- 從同桌 QR 再進來的新客人，都應掛在同一張訂單下
- `person_slot` 需在該訂單下遞增
- 不應限制人數

### 2.4 結單
- 一旦該訂單結單完成，例如 `payment_status = paid`
- 該桌的 active ordering context 應關閉
- 該訂單下的 ordering session 應失效
- 下次再進桌號時，應建立新的訂單作用域

## 3. 需要支援的 request / response

### 3.1 `GET /api/dinecore/tables/{tableCode}/entry-context`
request:
- 可帶 `ordering_session_token`

response 至少應回：
- `ordering_session_token`
- `ordering_cart_id`
- `person_slot`
- `ordering_label`
- `order_id`
- `order_no`
- `order_status`

### 3.2 `GET /api/dinecore/menu`
request:
- `table_code`
- `ordering_session_token`

### 3.3 `GET /api/dinecore/tables/{tableCode}/carts`
request:
- 可帶 `ordering_session_token`

response 至少應回：
- `ordering_session_token`
- `ordering_cart_id`
- `person_slot`
- `ordering_label`
- `carts`
- `cart_items_by_cart_id`

### 3.4 `POST /api/dinecore/carts/{cartId}/items`
request:
- 必須接受 `ordering_session_token`

規則：
- 實際寫入目標應由 token 對應的 `cart_id` 決定
- 不可只依前端傳入的目前查看 cart 決定

### 3.5 `PATCH /api/dinecore/carts/{cartId}/items/{cartItemId}`
request:
- 必須接受 `ordering_session_token`

### 3.6 `GET /api/dinecore/tables/{tableCode}/checkout-summary`
request:
- 必須接受 `ordering_session_token`

### 3.7 `POST /api/dinecore/tables/{tableCode}/checkout-submit`
request:
- 必須接受 `ordering_session_token`

規則：
- 應沿用該桌目前 active order 的 `order_id / order_no`
- 不可在 submit 時另外產生第二張訂單

## 4. 後端資料模型最低要求
- `active ordering context`
  - 需能由 `table_code` 找到目前未結單訂單
- `guest ordering session`
  - `session_token`
  - `order_id`
  - `order_no`
  - `person_slot`
  - `cart_id`
  - `display_label`
  - `status`

## 5. 驗收清單
- 同一瀏覽器重新整理後，仍回到原本 `person_slot`
- 同桌第二支手機進來時，會拿到同一張訂單下的新 `person_slot`
- 在購物車切換查看其他顧客分組後，加點仍回到本機 `ordering_cart_id`
- `cart / checkout` polling 時，不會讓 token 漂移
- 訂單結單後，再次進桌號會建立新訂單作用域
