# DineCore Milestone 1 API 契約草案

## 0. 文件用途
本文件定義 DineCore 在 Milestone 1 階段的 API 契約草案。

本文件用途為：
- 為前端模組提供穩定的資料交換界面
- 為後端實作提供最小一致的輸入與輸出預期
- 將手機顧客端與商家端的核心流程先對齊

本文件不負責：
- 定義世界語意本身
- 裁決訂單是否合法成立
- 定義資料庫結構或 controller 實作

---

## 1. 契約前提
- API 只作為世界狀態與世界意圖的對外表達界面
- Query 只揭露已成立狀態，不隱含狀態改變
- Command 只提交意圖，不保證世界一定接受
- 世界語意錯誤與工程錯誤分開處理
- Milestone 1 只覆蓋顧客端點餐主流程與其相依後台讀寫

---

## 2. 範圍
Milestone 1 API 只先涵蓋以下模組：
- `entry`
- `menu`
- `cart`
- `checkout`
- `order-tracker`
- `counter`
- `kitchen`
- `dashboard`

---

## 3. 統一回應結構

### 3.1 Query 回應格式
```json
{
  "data": {},
  "meta": {
    "request_id": "req_xxx",
    "timestamp": "2026-03-03T10:00:00Z"
  }
}
```

### 3.2 Command 回應格式
```json
{
  "data": {
    "accepted": true,
    "command_id": "cmd_xxx"
  },
  "meta": {
    "request_id": "req_xxx",
    "timestamp": "2026-03-03T10:00:00Z"
  }
}
```

### 3.3 世界語意錯誤格式
```json
{
  "error": {
    "type": "world_rejection",
    "code": "ORDERING_DISABLED",
    "message": "目前桌號暫停接單。"
  },
  "meta": {
    "request_id": "req_xxx",
    "timestamp": "2026-03-03T10:00:00Z"
  }
}
```

### 3.4 工程錯誤格式
```json
{
  "error": {
    "type": "transport_error",
    "code": "NETWORK_FAILURE",
    "message": "網路連線失敗。"
  },
  "meta": {
    "request_id": "req_xxx",
    "timestamp": "2026-03-03T10:00:00Z"
  }
}
```

---

## 4. 世界語意錯誤分類映射
- `world_rejection`
  - 世界拒絕該意圖
- `world_invisibility`
  - 狀態存在但對當前視角不可見
- `world_absence`
  - 世界中尚未存在該狀態
- `world_ignorance`
  - 世界忽略該請求

Milestone 1 建議錯誤碼：
- `TABLE_NOT_FOUND`
- `TABLE_INACTIVE`
- `ORDERING_DISABLED`
- `MENU_ITEM_SOLD_OUT`
- `MENU_ITEM_HIDDEN`
- `CART_NOT_FOUND`
- `ORDER_NOT_FOUND`
- `ORDER_ALREADY_SUBMITTED`
- `ORDER_NOT_PAYABLE`
- `ORDER_STATUS_NOT_EDITABLE`

---

## 5. Query API

### Q01 取得桌號入口上下文
用途：
- 供顧客掃碼進入時取得固定桌號狀態
- 並建立或恢復這支手機在該桌目前未結單訂單下的匿名點餐身份

Method:
- `GET /api/dinecore/tables/{tableCode}/entry-context`

Response:
```json
{
  "data": {
    "table": {
      "id": "tbl_01",
      "code": "A01",
      "name": "A01",
      "area_name": "前區",
      "dine_mode": "dine_in",
      "status": "active",
      "is_ordering_enabled": true
    },
    "ordering_session_token": "gsess_01",
    "ordering_cart_id": "cart_a",
    "person_slot": 1,
    "ordering_label": "1號顧客",
    "order_id": "ord_01",
    "order_no": "DC202603030001",
    "order_status": "draft"
  }
}
```

世界語意錯誤：
- `world_absence` / `TABLE_NOT_FOUND`
- `world_invisibility` / `TABLE_INACTIVE`
- `world_rejection` / `ORDERING_DISABLED`

規則補充：
- 若 request 未帶 `ordering_session_token`，後端應視為第一次進來
- 後端需先找這桌目前未結單訂單；若沒有，先建立新的訂單編號
- 再於該訂單下建立新的匿名 ordering session
- 若 request 已帶有效 token，後端應恢復同一個匿名身份

### Q02 取得菜單分類與品項
用途：
- 供顧客端載入菜單首頁

Method:
- `GET /api/dinecore/menu`

Query Params:
- `table_code`
- `dine_mode`

Response:
```json
{
  "data": {
    "categories": [
      {
        "id": "cat_main",
        "name": "主餐",
        "sort_order": 10
      }
    ],
    "items": [
      {
        "id": "item_beef_noodle",
        "category_id": "cat_main",
        "name": "牛肉麵",
        "description": "招牌紅燒牛肉麵",
        "image_url": "/images/beef-noodle.jpg",
        "base_price": 180,
        "is_sold_out": false,
        "is_hidden": false,
        "tags": ["牛肉", "招牌"],
        "allergen_tags": ["麩質"],
        "spicy_level": "medium"
      }
    ]
  }
}
```

### Q03 取得品項客製選項
用途：
- 供顧客在加入購物車前顯示規格群組

Method:
- `GET /api/dinecore/menu/items/{itemId}/options`

Response:
```json
{
  "data": {
    "item_id": "item_beef_noodle",
    "option_groups": [
      {
        "id": "grp_size",
        "name": "份量",
        "selection_type": "single",
        "is_required": true,
        "options": [
          {
            "id": "opt_regular",
            "name": "正常",
            "price_delta": 0,
            "status": "available"
          },
          {
            "id": "opt_large",
            "name": "加大",
            "price_delta": 20,
            "status": "available"
          }
        ]
      }
    ]
  }
}
```

世界語意錯誤：
- `world_absence` / `MENU_ITEM_NOT_FOUND`
- `world_invisibility` / `MENU_ITEM_HIDDEN`

### Q04 取得桌號下的子購物車清單
用途：
- 供顧客查看同桌多個子購物車摘要
- 同時告知這支手機目前的匿名點餐身份

Method:
- `GET /api/dinecore/tables/{tableCode}/carts`

Response:
```json
{
  "data": {
    "ordering_session_token": "gsess_01",
    "ordering_cart_id": "cart_a",
    "person_slot": 1,
    "ordering_label": "1號顧客",
    "carts": [
      {
        "id": "cart_a",
        "guest_label": "A 客人",
        "status": "active",
        "item_count": 2,
        "subtotal": 220
      }
    ]
  }
}
```

### Q05 取得單一子購物車明細
用途：
- 供顧客端查看或編輯個人子購物車

Method:
- `GET /api/dinecore/carts/{cartId}`

Response:
```json
{
  "data": {
    "cart": {
      "id": "cart_a",
      "table_code": "A01",
      "guest_label": "A 客人",
      "status": "active",
      "items": [
        {
          "id": "cart_item_01",
          "menu_item_id": "item_beef_noodle",
          "item_name_snapshot": "牛肉麵",
          "base_price_snapshot": 180,
          "quantity": 1,
          "note": "少辣",
          "selected_options": [
            {
              "group_id": "grp_size",
              "option_id": "opt_large",
              "name": "加大",
              "price_delta": 20
            }
          ],
          "line_total": 200
        }
      ]
    }
  }
}
```

### Q06 取得結帳摘要
用途：
- 供顧客端合單前顯示按人金額、服務費與稅金

Method:
- `GET /api/dinecore/tables/{tableCode}/checkout-summary`

Response:
```json
{
  "data": {
    "table_code": "A01",
    "persons": [
      {
        "cart_id": "cart_a",
        "guest_label": "A 客人",
        "subtotal": 200,
        "total": 220
      }
    ],
    "subtotal_amount": 200,
    "service_fee_amount": 10,
    "tax_amount": 10,
    "total_amount": 220
  }
}
```

### Q06-1 取得桌號入口上下文
用途：
- 供顧客端建立或恢復本機匿名點餐 session
- 並掛入該桌目前未結單的訂單

Method:
- `GET /api/dinecore/tables/{tableCode}/entry-context`

Response:
```json
{
  "data": {
    "table_code": "A01",
    "table_name": "靠窗 1 號桌",
    "ordering_session_token": "gsess_01",
    "ordering_cart_id": "cart_a",
    "person_slot": 1,
    "ordering_label": "1號顧客",
    "order_id": "ord_01",
    "order_no": "DC202603030001",
    "order_status": "pending"
  }
}
```

### Q07 取得訂單追蹤資訊
用途：
- 供顧客端查看下單後狀態

Method:
- `GET /api/dinecore/orders/{orderId}/tracker`

Response:
```json
{
  "data": {
    "order": {
      "id": "ord_01",
      "order_no": "DC202603030001",
      "table_code": "A01",
      "order_status": "pending",
      "payment_status": "unpaid",
      "estimated_wait_minutes": 15
    },
    "timeline": [
      {
        "status": "pending",
        "changed_at": "2026-03-03T10:00:00Z",
        "source": "customer",
        "note": "訂單已送出"
      }
    ]
  }
}
```

### Q08 取得櫃台訂單列表
用途：
- 供櫃台查看即時訂單列表

Method:
- `GET /api/dinecore/staff/counter/orders`

Query Params:
- `table_code`
- `order_no`
- `order_status`
- `payment_status`

Response:
```json
{
  "data": {
    "orders": [
      {
        "id": "ord_01",
        "order_no": "DC202603030001",
        "table_code": "A01",
        "order_status": "pending",
        "payment_status": "unpaid",
        "total_amount": 220,
        "guest_count": 2,
        "created_at": "2026-03-03T10:00:00Z"
      }
    ]
  }
}
```

### Q09 取得櫃台訂單明細
用途：
- 供櫃台查看單張訂單與付款資訊

Method:
- `GET /api/dinecore/staff/counter/orders/{orderId}`

Response:
```json
{
  "data": {
    "order": {
      "id": "ord_01",
      "order_no": "DC202603030001",
      "table_code": "A01",
      "order_status": "pending",
      "payment_status": "unpaid",
      "subtotal_amount": 200,
      "service_fee_amount": 10,
      "tax_amount": 10,
      "total_amount": 220
    },
    "persons": [
      {
        "guest_label": "A 客人",
        "person_total": 220
      }
    ],
    "items": []
  }
}
```

### Q10 取得廚房看板訂單
用途：
- 供廚房顯示未完成訂單

Method:
- `GET /api/dinecore/staff/kitchen/orders`

Query Params:
- `status`

Response:
```json
{
  "data": {
    "orders": [
      {
        "id": "ord_01",
        "order_no": "DC202603030001",
        "table_code": "A01",
        "order_status": "preparing",
        "created_at": "2026-03-03T10:00:00Z",
        "items": [
          {
            "id": "ord_item_01",
            "item_name_snapshot": "牛肉麵",
            "quantity": 1,
            "note": "少辣",
            "selected_options_snapshot": [
              {
                "name": "加大"
              }
            ]
          }
        ]
      }
    ]
  }
}
```

### Q11 取得店長總覽統計
用途：
- 供店長查看當日總覽

Method:
- `GET /api/dinecore/staff/manager/dashboard`

Response:
```json
{
  "data": {
    "daily_order_count": 52,
    "daily_revenue_total": 13680,
    "top_selling_items": [
      {
        "menu_item_id": "item_beef_noodle",
        "name": "牛肉麵",
        "quantity": 18
      }
    ]
  }
}
```

---

## 6. Command API

### C01 建立子購物車
用途：
- 供同桌顧客建立個人子購物車

Method:
- `POST /api/dinecore/tables/{tableCode}/carts`

Request:
```json
{
  "guest_label": "A 客人"
}
```

Response:
```json
{
  "data": {
    "accepted": true,
    "command_id": "cmd_create_cart_01",
    "cart_id": "cart_a"
  }
}
```

世界語意錯誤：
- `world_rejection` / `ORDERING_DISABLED`
- `world_invisibility` / `TABLE_INACTIVE`

### C02 加入品項到子購物車
用途：
- 供顧客加入品項與客製選項

Method:
- `POST /api/dinecore/carts/{cartId}/items`

Request:
```json
{
  "ordering_session_token": "gsess_01",
  "menu_item_id": "item_beef_noodle",
  "quantity": 1,
  "note": "少辣",
  "selected_options": [
    {
      "group_id": "grp_size",
      "option_id": "opt_large"
    }
  ]
}
```

Response:
```json
{
  "data": {
    "accepted": true,
    "command_id": "cmd_add_cart_item_01",
    "cart_item_id": "cart_item_01"
  }
}
```

世界語意錯誤：
- `world_rejection` / `MENU_ITEM_SOLD_OUT`
- `world_invisibility` / `MENU_ITEM_HIDDEN`
- `world_absence` / `CART_NOT_FOUND`

規則補充：
- 正式後端應優先以 `ordering_session_token` 對應的 `cart_id` 決定寫入目標
- 不可只依前端目前正在看的 cart 決定加點歸屬

### C03 更新子購物車品項
用途：
- 供顧客調整數量、備註與客製內容

Method:
- `PATCH /api/dinecore/carts/{cartId}/items/{cartItemId}`

Request:
```json
{
  "quantity": 2,
  "note": "加蔥",
  "selected_options": [
    {
      "group_id": "grp_spicy",
      "option_id": "opt_spicy_high"
    }
  ]
}
```

### C04 刪除子購物車品項
用途：
- 供顧客刪除購物車品項

Method:
- `DELETE /api/dinecore/carts/{cartId}/items/{cartItemId}`

Response:
```json
{
  "data": {
    "accepted": true,
    "command_id": "cmd_remove_cart_item_01"
  }
}
```

### C05 送出同桌合單訂單
用途：
- 供顧客將多個子購物車合單送出

Method:
- `POST /api/dinecore/tables/{tableCode}/orders`

Request:
```json
{
  "cart_ids": ["cart_a", "cart_b"],
  "client_request_id": "client_req_001"
}
```

Response:
```json
{
  "data": {
    "accepted": true,
    "command_id": "cmd_submit_order_01",
    "order_id": "ord_01",
    "order_no": "DC202603030001"
  }
}
```

世界語意錯誤：
- `world_rejection` / `ORDERING_DISABLED`
- `world_rejection` / `ORDER_ALREADY_SUBMITTED`
- `world_absence` / `CART_NOT_FOUND`

備註：
- `client_request_id` 用於前端防止重複送單

### C06 櫃台人工確認付款
用途：
- 供櫃台標記付款狀態

Method:
- `POST /api/dinecore/staff/counter/orders/{orderId}/payments/confirm`

Request:
```json
{
  "payment_method": "cash",
  "confirmed_by": "counter_01",
  "note": "現金收款完成"
}
```

Response:
```json
{
  "data": {
    "accepted": true,
    "command_id": "cmd_confirm_payment_01",
    "payment_status": "paid"
  }
}
```

世界語意錯誤：
- `world_absence` / `ORDER_NOT_FOUND`
- `world_rejection` / `ORDER_NOT_PAYABLE`

### C07 櫃台更新訂單狀態
用途：
- 供櫃台推進待處理、製作中、完成、已取餐狀態

Method:
- `POST /api/dinecore/staff/counter/orders/{orderId}/status`

Request:
```json
{
  "status": "preparing",
  "changed_by": "counter_01",
  "note": "已交廚房處理"
}
```

### C08 廚房標記訂單完成
用途：
- 供廚房更新出餐狀態

Method:
- `POST /api/dinecore/staff/kitchen/orders/{orderId}/status`

Request:
```json
{
  "status": "ready",
  "changed_by": "kitchen_01",
  "note": "出餐完成"
}
```

### C09 廚房設定品項缺貨
用途：
- 供廚房或店長將品項標示為售完

Method:
- `POST /api/dinecore/staff/kitchen/menu/items/{itemId}/sold-out`

Request:
```json
{
  "is_sold_out": true,
  "changed_by": "kitchen_01",
  "note": "今日備料已售完"
}
```

---

## 7. 欄位命名約定
- API 欄位以 snake_case 為主
- 金額欄位一律明確帶上 `_amount`
- 狀態欄位一律明確帶上 `_status`
- 快照資料一律帶上 `_snapshot`
- 客製選項陣列統一使用 `selected_options`

---

## 8. 手機顧客端與商家端界面差異

### 顧客端 Query
- 只揭露該桌與該訂單必要資訊
- 不揭露商家操作紀錄
- 不揭露其他桌訂單資料

### 商家端 Query
- 可查看訂單列表、付款狀態、出餐資訊與統計摘要
- 不在 Milestone 1 納入完整稽核與報表匯出

---

## 9. 目前不納入 Milestone 1 的 API
- 線上支付建立與回調
- 退款與部分退款
- 改單與取消單
- 補印小白單
- 角色權限管理
- 關帳與店長解鎖
- 完整報表匯出

---

## 10. 下一步建議
1. 依本契約草案建立前端 mock service 層
2. 用 mock service 串接目前已建立的 Milestone 1 模組骨架
3. 再決定先從顧客端主流程或櫃台端主流程開始補實作

---
