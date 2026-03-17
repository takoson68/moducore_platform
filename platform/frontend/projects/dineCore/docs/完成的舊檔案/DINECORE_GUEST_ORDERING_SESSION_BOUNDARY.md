# DINECORE_GUEST_ORDERING_SESSION_BOUNDARY

日期：2026-03-03

## 1. 文件目的
本文件定義 DineCore 顧客端在同桌多人點餐時的匿名身份分配方式。

本文件要解決的問題：
- 同一支手機在購物車頁切換不同顧客分組後，後續加點容易被送到錯誤 cart
- 顧客不應手動選身份名稱
- 前端需要一個由後端分配、且可持續恢復的本機加點目標

## 2. 核心結論
- 一桌仍然只有固定桌號入口
- 但每支手機進入桌號後，後端要在「該桌目前未結單的訂單」下建立或恢復匿名 `ordering session`
- 沒有 `ordering_session_token` 代表第一次進來
- 後端會先確認這桌是否已有未結單訂單；若沒有，先建立新的訂單編號
- 後端用進入先後在該訂單下分配 `person_slot`
- 分配完成後，後續綁定必須靠 `ordering_session_token`
- 前端只吃 API 回來的 `ordering_cart_id / person_slot / ordering_label`
- `person_slot` 不設上限，因為只要同一張訂單尚未結單，後續進來的客人都應掛在同一張訂單下

## 3. 關鍵模型

### 3.1 `GuestOrderingSession`
用途：
- 表示某一支手機在某一桌中的匿名點餐身份

建議欄位：
- `id`
- `table_id`
- `table_code`
- `session_token`
- `order_id`
- `order_no`
- `person_slot`
- `cart_id`
- `display_label`
- `status`
- `created_at`
- `last_seen_at`

說明：
- `person_slot` 建議存遞增整數 `1 / 2 / 3 / ...`
- 顯示成 `-A` 或 `-1` 應由顯示層決定
- `display_label` 例如 `1號顧客`
- `order_id / order_no` 是這個 token 的主要作用域，不是單純 `table_code`

### 3.2 `GuestCart`
用途：
- 表示桌內某一匿名身份的子購物車

補充規則：
- `guest_label` 是顯示用欄位
- 本機點餐歸屬不應再只靠 `guest_label`
- 真正歸屬應由 `GuestOrderingSession.cart_id` 決定

### 3.3 `OrderPerson`
用途：
- 保存訂單內每個匿名身份的分帳歸屬

建議補欄位：
- `person_slot`
- `display_label`

## 4. API 契約要求

### 4.0 通用規則
- 顧客端第一次進入桌號入口或菜單頁時，前端應先向後端請求 ordering session
- 若 request 未帶 `ordering_session_token`，後端應視為第一次進來
- 後端此時要先確認這桌目前是否已有未結單訂單；若沒有，先建立新訂單編號
- 然後在該未結單訂單下建立新的 ordering session 並回傳 token
- 前端收到 token 後，必須記錄在瀏覽器，作為這支手機在這張桌內的匿名識別
- 之後所有顧客端 API request 都必須攜帶 `ordering_session_token`
- 若 token 缺失、失效或不存在，後端才可重新分配新的 ordering session
- 只要同一張訂單尚未結單，從同一桌號再進來的新客人都應掛在同一張訂單下，不應另外限制人數

### 4.1 `entry/context`
至少應回：
- `ordering_session_token`
- `ordering_cart_id`
- `person_slot`
- `ordering_label`
- `order_id`
- `order_no`
- `order_status`

規則：
- `entry/context` 應作為顧客端第一次初始化 token 的優先入口
- 若顧客直接 deep link 進 `menu`，`menu` 也必須能觸發同等初始化流程
- 這裡回傳的 `order_id / order_no` 應是這桌目前未結單的訂單，而不是靜態桌號資訊

### 4.2 `cart/get`
至少應回：
- `ordering_session_token`
- `ordering_cart_id`
- `person_slot`
- `ordering_label`
- `carts`
- `cart_items_by_cart_id`

### 4.3 `cart/add-item`
規則：
- 前端必須傳 `ordering_session_token`
- 後端應以 session 對應的 `cart_id` 為準
- 不可只依前端目前正在看的 cart 決定寫入目標

### 4.4 其他顧客端 API
包含但不限於：
- `menu`
- `cart/change-item-quantity`
- `cart/update-item`
- `checkout/summary`
- `checkout/submit`

規則：
- 只要仍處於「未送單前的桌內匿名點餐流程」，request 都必須攜帶 `ordering_session_token`
- 這個 token 的用途是識別這支手機，不是會員登入

## 5. 前端模組邊界
- `entry`：載入桌號與 ordering session，不做身份分配
- `cart`：保存 `orderingCartId` 與 `viewingCartId`，兩者不可混用
- `menu`：加點只走 `orderingCartId`
- `checkout`：顯示整桌合單結果與各 `person_slot`
- `order-tracker / counter / kitchen`：只讀已送出訂單，不直接依賴 ordering session

## 6. 工程規範
- 共享真相只能走 API 邊界
- ordering session 必須由後端 API 發放與恢復
- 前端 store 只保存 API 回來的 session 事實
- 不可用 project-level business service 自行生成身份

## 7. 落地順序
1. 更新 `entry/context` 與 `cart/get` contract
2. mock runtime 補上真正的 guest ordering session
3. 後端正式落地 session 與 `person_slot`
