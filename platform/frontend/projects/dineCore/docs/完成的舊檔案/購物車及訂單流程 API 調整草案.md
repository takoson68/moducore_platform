# 購物車及訂單流程 API 調整草案

## 0. 文件用途

本文件用於定義 DineCore「主單 + 多批次送單」模型下，各顧客端與商家端 API 應如何調整。

本文件的目的是：

- 將資料表草案轉成實際 API 行為
- 明確界定哪些 API 可以建立批次、哪些不能
- 避免前端與後端對同一流程出現不同理解

---

## 1. 設計原則

本次 API 調整必須遵守以下原則：

- 顧客端只有 `entry-context` 可以建立新的匿名顧客 session
- 顧客端只有目前 `draft batch` 可以被修改
- 每次送單後，原批次立即鎖定
- 後續加點必須進入新的 `draft batch`
- tracker / 櫃台 / 廚房需要能辨識批次順序

---

## 2. 名詞對照

### 主單（Order）

- 對應 `dinecore_orders`
- 表示一張桌目前這一輪用餐的大單容器

### 批次（Batch）

- 對應 `dinecore_order_batches`
- 表示某次送單的獨立批次

### 草稿批次（Draft Batch）

- 目前仍可編輯的批次
- 所有 cart API 只允許操作這一批

### 已送出批次（Submitted Batch）

- 已由顧客確認送單
- 不可再編輯

---

## 3. 顧客端 API 草案

### 3.1 `GET /api/dinecore/entry-context`

用途：

- 進桌號入口
- 建立或回復匿名顧客身份
- 取得目前可編輯的 draft batch

合法行為：

- 若桌號沒有 `open order`
  - 建立主單
  - 建立 `batch_no = 1` 的 draft batch
- 若有主單但沒有 draft batch
  - 建立下一個新的 draft batch
- 若 request 帶有效 `ordering_session_token`
  - 回到原本顧客身份

建議 response：

```json
{
  "ok": true,
  "data": {
    "order_id": 123,
    "order_no": "DC202603040001",
    "ordering_session_token": "dcs_xxx",
    "ordering_cart_id": "guest-1",
    "person_slot": 1,
    "ordering_label": "1號顧客",
    "current_batch_id": 10,
    "current_batch_no": 2,
    "current_batch_status": "draft"
  }
}
```

---

### 3.2 `GET /api/dinecore/menu`

用途：

- 取得菜單與目前可點餐上下文

限制：

- 不得建立新 session
- 不得建立新 batch
- 若缺少有效 `ordering_session_token`
  - 回 `ORDERING_SESSION_REQUIRED`

建議 response 補充：

- `current_batch_id`
- `current_batch_no`

目的：

- 讓前端知道目前是在哪一批上進行加點

---

### 3.3 `GET /api/dinecore/carts`

用途：

- 顧客端購物車輪詢核心 API

責任：

- 回傳目前 draft batch 的 cart 資料
- 回傳目前這張桌的參與顧客數
- 回傳已送出批次摘要

限制：

- 不得建立新 session
- 不得建立新 batch

建議 response：

```json
{
  "ok": true,
  "data": {
    "orderingSessionToken": "dcs_xxx",
    "orderingCartId": "guest-1",
    "orderingLabel": "1號顧客",
    "personSlot": 1,
    "currentBatchId": 10,
    "currentBatchNo": 2,
    "currentBatchStatus": "draft",
    "participantCount": 3,
    "carts": [],
    "cartItemsByCartId": {},
    "submittedBatches": [
      {
        "batchId": 9,
        "batchNo": 1,
        "status": "submitted",
        "submittedAt": "2026-03-04 12:00:00",
        "totalItems": 6,
        "totalAmount": 430
      }
    ]
  }
}
```

---

### 3.4 `POST /api/dinecore/cart/add-item`

用途：

- 將商品加入目前 draft batch

限制：

- 只能寫入目前 `draft batch`
- 若當前 batch 已不是 `draft`
  - 回 `BATCH_LOCKED`

建議 server 行為：

- 由 `ordering_session_token` 找到 session
- 由主單找到目前最新 `draft batch`
- item 寫入該 `batch_id`

---

### 3.5 `POST /api/dinecore/cart/change-item-quantity`

用途：

- 修改 draft batch 中的購物車品項數量

限制：

- 只允許改 draft batch
- 已 submitted batch 一律禁止

---

### 3.6 `POST /api/dinecore/cart/update-item`

用途：

- 修改 draft batch 中某品項的客製內容

限制：

- 只允許改 draft batch

---

### 3.7 `GET /api/dinecore/checkout-summary`

用途：

- 顯示目前即將送出的那一批

限制：

- 只統計目前 `draft batch`
- 不應混入已 submitted batch

建議 response 補充：

- `currentBatchId`
- `currentBatchNo`
- `participantCount`

---

### 3.8 `POST /api/dinecore/checkout-submit`

用途：

- 將目前 draft batch 合併送出並鎖定

合法流程：

1. 檢查目前 batch 為 `draft`
2. 將 batch 改為 `submitted`
3. 寫入 `submitted_at` / `locked_at`
4. 建立下一個新的空 `draft batch`

建議 response：

```json
{
  "ok": true,
  "data": {
    "orderId": 123,
    "orderNo": "DC202603040001",
    "submittedBatchId": 9,
    "submittedBatchNo": 1,
    "nextBatchId": 10,
    "nextBatchNo": 2
  }
}
```

---

### 3.9 `GET /api/dinecore/order-tracker`

用途：

- 顯示整張桌的送單歷史與當前狀態

建議 response：

- `order`
- `batches`
- `currentDraftBatch`

其中 `batches` 每筆至少包含：

- `batchId`
- `batchNo`
- `status`
- `submittedAt`
- `items`
- `subtotal`

---

## 4. 商家端 API 草案

### 4.1 櫃台端

建議新增或調整：

- 主單總覽 API
- 批次明細 API

櫃台需要同時看：

- 這張桌目前總累積金額
- 哪一輪已送出
- 每輪送了什麼

---

### 4.2 廚房端

建議以 batch 為主單位。

廚房不應再只看桌號總單，而應看：

- `batchNo`
- `submittedAt`
- `items`
- `status`

原因：

- 出餐流程天然就是按送單批次進來

---

## 5. 錯誤碼建議

建議新增以下錯誤碼：

- `ORDERING_SESSION_REQUIRED`
  - 未帶有效匿名顧客 session

- `BATCH_LOCKED`
  - 目前批次已送出，不可再修改

- `DRAFT_BATCH_NOT_FOUND`
  - 當前主單下找不到可編輯 draft batch

- `SUBMITTED_BATCH_NOT_EDITABLE`
  - 嘗試修改已 submitted batch

- `NEXT_DRAFT_BATCH_CREATE_FAILED`
  - 送單後建立新 draft batch 失敗

---

## 6. 前後端配合規則

### 前端必須做的事

- 每次 request 都帶 `ordering_session_token`
- 每次輪詢都接受 batch 狀態可能切換
- 發現目前 batch 已鎖定時，自動刷新上下文

### 後端必須做的事

- 不得由 menu / cart / checkout API 偷偷建立新 session
- 不得讓 cart API 修改非 draft batch
- 送單後必須立即開啟新 draft batch

---

## 7. 建議實作順序

1. `entry-context`
2. `carts`
3. `cart/add-item`
4. `cart/change-item-quantity`
5. `cart/update-item`
6. `checkout-summary`
7. `checkout-submit`
8. `order-tracker`
9. 櫃台 / 廚房 API

---

## 8. 驗證案例

### Case 1：首單送出

- A / B 同桌加入商品
- A 送單
- 系統產生 `batch-1 submitted`
- 系統建立 `batch-2 draft`

### Case 2：送單後 B 輪詢

- B 在購物車頁停留
- A 完成送單
- B 下一輪 polling 後：
  - 舊購物車內容不再可編輯
  - 畫面切到新的 draft batch

### Case 3：後續加點

- B 再加商品
- 商品應寫入 `batch-2`
- `batch-1` 不得被污染

### Case 4：Tracker 顯示

- tracker 應列出：
  - batch-1
  - batch-2

---

## 9. 下一份承接文件

本文件完成後，建議接續：

- `購物車及訂單流程前端頁面切換規則.md`
- 或直接開始 controller / store 實作

