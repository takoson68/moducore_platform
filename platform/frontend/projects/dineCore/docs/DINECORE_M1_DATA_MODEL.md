# DineCore Milestone 1 資料模型草案

## 0. 文件用途
本文件定義 DineCore 在 Milestone 1 階段的核心資料模型草案。

本文件用途為：
- 支撐手機顧客端點餐主流程
- 支撐櫃台與廚房接單前的資料結構設計
- 作為後續前端 store、API 契約與資料表設計的基礎

本文件不負責：
- 資料庫欄位型別定稿
- API endpoint 命名定稿
- Phase 2 報表與稽核完整模型

---

## 1. 建模前提
- 顧客端以手機為主
- 商家端以平板或桌機為主
- QR Code 採固定桌號入口
- 顧客全程匿名
- 同桌多人點餐採子購物車模式
- 分帳只按人，不按品項
- 第一階段付款採櫃台人工確認
- 廚房先不拆工作站

---

## 2. 模型總覽
Milestone 1 先定義以下核心實體：

1. `Table`
2. `MenuCategory`
3. `MenuItem`
4. `MenuItemOptionGroup`
5. `MenuItemOption`
6. `GuestOrderingSession`
7. `GuestCart`
8. `GuestCartItem`
9. `Order`
10. `OrderPerson`
11. `OrderItem`
12. `PaymentRecord`
13. `OrderStatusTimeline`

---

## 3. 顧客端主模型

### 3.1 `Table`
用途：
- 表示固定桌號入口
- 作為顧客掃碼後的上下文根節點

建議欄位：
- `id`
- `code`
- `name`
- `area_name`
- `dine_mode`
- `status`
- `is_ordering_enabled`

欄位說明：
- `code`
  - QR Code 對應識別值
- `dine_mode`
  - `dine_in` / `takeout` / `pickup`
- `status`
  - `active` / `inactive`
- `is_ordering_enabled`
  - 是否允許接單

備註：
- `Table` 仍是固定桌號入口上下文
- 但為了讓同桌多支手機維持穩定點餐歸屬，Milestone 1 已補入匿名 `GuestOrderingSession`

### 3.2 `MenuCategory`
用途：
- 顧客端菜單分類

建議欄位：
- `id`
- `name`
- `sort_order`
- `status`

### 3.3 `MenuItem`
用途：
- 顧客點選的商品主體

建議欄位：
- `id`
- `category_id`
- `name`
- `description`
- `image_url`
- `base_price`
- `is_sold_out`
- `is_hidden`
- `tags`
- `allergen_tags`
- `spicy_level`
- `sort_order`

欄位說明：
- `tags`
  - 例如肉類、素食、人氣、招牌
- `allergen_tags`
  - 例如花生、牛奶、蛋

### 3.4 `MenuItemOptionGroup`
用途：
- 定義品項客製群組，例如份量、辣度、加料

建議欄位：
- `id`
- `menu_item_id`
- `name`
- `selection_type`
- `is_required`
- `sort_order`

欄位說明：
- `selection_type`
  - `single` / `multiple`

### 3.5 `MenuItemOption`
用途：
- 定義客製選項，例如加麵、加大、加辣、加蔥

建議欄位：
- `id`
- `group_id`
- `name`
- `price_delta`
- `status`
- `sort_order`

---

## 4. 匿名點餐身份模型

### 4.1 `GuestOrderingSession`
用途：
- 表示某一支手機在某一桌內的匿名點餐身份

建議欄位：
- `id`
- `table_id`
- `session_token`
- `order_id`
- `order_no`
- `person_slot`
- `cart_id`
- `display_label`
- `status`
- `created_at`
- `last_seen_at`

欄位說明：
- `person_slot`
  - 例如 `1`、`2`、`3`、`4`，並可持續遞增
- `cart_id`
  - 這支手機後續加點要寫入的子購物車
- `display_label`
  - 例如 `1號顧客`、`A 顧客`

備註：
- `GuestOrderingSession` 應綁在該桌目前未結單的訂單下
- 連線順序只用來在該訂單下第一次分配 `person_slot`
- 後續持續綁定必須靠 `session_token`

---

## 5. 子購物車模型

### 5.1 `GuestCart`
用途：
- 表示同桌某一位匿名顧客的子購物車

建議欄位：
- `id`
- `table_id`
- `guest_label`
- `status`
- `created_at`
- `updated_at`

欄位說明：
- `guest_label`
  - 例如「A 客人」、「小明」、「1 號」
- `status`
  - `active` / `submitted` / `cancelled`

備註：
- `guest_label` 是顯示用欄位，不應再作為本機身份分配的唯一依據
- 本機加點歸屬應由 `GuestOrderingSession.cart_id` 決定

### 5.2 `GuestCartItem`
用途：
- 子購物車內的單筆品項

建議欄位：
- `id`
- `cart_id`
- `menu_item_id`
- `item_name_snapshot`
- `base_price_snapshot`
- `quantity`
- `note`
- `selected_options`
- `line_total`

欄位說明：
- `item_name_snapshot`
  - 下單前保留當下顯示名稱
- `base_price_snapshot`
  - 保留加入購物車當下基礎價格
- `selected_options`
  - 陣列型資料，保存所選客製項目

---

## 6. 合單訂單模型

### 6.1 `Order`
用途：
- 同桌多個子購物車合併後產生的正式訂單

建議欄位：
- `id`
- `order_no`
- `table_id`
- `table_code`
- `dine_mode`
- `order_status`
- `payment_status`
- `subtotal_amount`
- `service_fee_amount`
- `tax_amount`
- `total_amount`
- `created_at`
- `submitted_at`

欄位說明：
- `order_status`
  - `pending` / `preparing` / `ready` / `picked_up` / `cancelled`
- `payment_status`
  - `unpaid` / `confirming` / `paid`

### 6.2 `OrderPerson`
用途：
- 保存每位匿名顧客在該張訂單中的分帳歸屬

建議欄位：
- `id`
- `order_id`
- `person_slot`
- `guest_label`
- `display_label`
- `cart_id_snapshot`
- `person_subtotal`
- `person_total`

備註：
- 因為分帳只按人，所以 `OrderPerson` 是必要模型

### 6.3 `OrderItem`
用途：
- 訂單中的單筆品項

建議欄位：
- `id`
- `order_id`
- `order_person_id`
- `menu_item_id`
- `item_name_snapshot`
- `base_price_snapshot`
- `selected_options_snapshot`
- `quantity`
- `note`
- `item_status`
- `line_total`

欄位說明：
- `item_status`
  - `pending` / `preparing` / `ready` / `served` / `cancelled`

備註：
- 即使 Milestone 1 廚房不做工作站拆單，也建議保留 item-level 狀態能力

---

## 6. 付款與狀態模型

### 6.1 `PaymentRecord`
用途：
- 保存櫃台人工付款確認結果

建議欄位：
- `id`
- `order_id`
- `payment_method`
- `payment_status`
- `confirmed_by`
- `confirmed_at`
- `note`

欄位說明：
- `payment_method`
  - `cash` / `manual_card` / `manual_wallet`
- `payment_status`
  - `unpaid` / `confirming` / `paid` / `failed`

### 6.2 `OrderStatusTimeline`
用途：
- 保存訂單狀態流轉，供顧客追蹤與後續稽核

建議欄位：
- `id`
- `order_id`
- `status`
- `changed_by`
- `changed_at`
- `source`
- `note`

欄位說明：
- `source`
  - `customer` / `counter` / `kitchen` / `system`

---

## 7. 商家端關注資料

### 櫃台端主要關注欄位
- `order_no`
- `table_code`
- `order_status`
- `payment_status`
- `total_amount`
- `guest_count`
- `created_at`

### 廚房端主要關注欄位
- `order_no`
- `table_code`
- `order_status`
- `items[].item_name_snapshot`
- `items[].quantity`
- `items[].note`
- `items[].selected_options_snapshot`
- `created_at`

### 店長端 Milestone 1 主要關注欄位
- `daily_order_count`
- `daily_revenue_total`
- `top_selling_items`

---

## 8. 狀態列舉建議

### 桌號狀態
- `active`
- `inactive`

### 點餐可用狀態
- `enabled`
- `disabled`

### 子購物車狀態
- `active`
- `submitted`
- `cancelled`

### 訂單狀態
- `pending`
- `preparing`
- `ready`
- `picked_up`
- `cancelled`

### 付款狀態
- `unpaid`
- `confirming`
- `paid`
- `failed`

### 品項狀態
- `available`
- `sold_out`
- `hidden`

---

## 9. 關聯關係
- 一個 `Table` 可對應多個 `GuestCart`
- 一個 `GuestCart` 可對應多個 `GuestCartItem`
- 多個 `GuestCart` 可合併成一個 `Order`
- 一個 `Order` 可對應多個 `OrderPerson`
- 一個 `OrderPerson` 可對應多個 `OrderItem`
- 一個 `Order` 可對應一筆或多筆 `PaymentRecord`
- 一個 `Order` 可對應多筆 `OrderStatusTimeline`

---

## 10. 前端 store 建議切分

### 手機顧客端
- `entryStore`
  - 桌號與入口狀態
- `menuStore`
  - 菜單分類、品項、客製選項
- `cartStore`
  - 子購物車與購物車品項
- `checkoutStore`
  - 合單明細、金額計算、送單狀態
- `orderTrackerStore`
  - 訂單進度與狀態更新

### 商家端
- `counterOrderStore`
  - 櫃台訂單列表與付款確認
- `kitchenBoardStore`
  - 廚房未完成訂單與完成狀態
- `dashboardStore`
  - 今日營收、訂單數、熱門品項

---

## 11. 目前不納入 Milestone 1 的資料
- 員工完整帳號系統
- 退款明細模型
- 補印記錄模型
- 關帳與解鎖模型
- 工作站拆單模型
- 線上支付交易模型

---

## 12. 下一步建議
1. 依本模型草案定義 Milestone 1 的前端模組骨架
2. 再整理對應的 API 契約草案
3. 最後才開始實作頁面與互動流程

---
