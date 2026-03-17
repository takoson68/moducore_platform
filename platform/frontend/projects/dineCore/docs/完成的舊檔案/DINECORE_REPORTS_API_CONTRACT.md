# DINECORE_REPORTS_API_CONTRACT

更新日期：2026-03-03

## 1. 用途

本文件定義 `dineCore` `reports` 模組進入正式後端 API 時的最小契約。

目標：
- 讓 `reports` 從 mock runtime 遷移到 real API 時不重寫前端模組結構
- 固定 `summary / orders / export` 的 request 與 response shape
- 保持 `world / store / api` 邊界不變

---

## 2. 模組邊界

`reports` 只讀取報表投影資料，不直接修改訂單主資料。

正式 API 必須維持：
- `reportsApi.js` 只負責 transport
- `service.js` 只負責資料整理與匯出格式
- `store.js` 只持有報表查詢狀態

不得：
- 讓 `reports` 直接改單
- 讓 `reports` 直接寫付款狀態
- 讓 `reports` 依賴 `counter` 或 `dashboard` API response shape

---

## 3. 授權與路由範圍

前端 route：
- `/staff/manager/reports`

後端權限：
- `deputy_manager`
- `manager`

未授權時應回：
- HTTP `403`
- code: `STAFF_ROLE_FORBIDDEN`

未登入時應回：
- HTTP `401`
- code: `STAFF_SESSION_REQUIRED`

---

## 4. Query Filters Contract

`reports` 所有查詢應共用以下 query shape：

```json
{
  "date_from": "2026-03-03",
  "date_to": "2026-03-03",
  "status": "all",
  "payment_status": "all",
  "payment_method": "all",
  "keyword": ""
}
```

欄位說明：
- `date_from`
- `date_to`
- `status`
- `payment_status`
- `payment_method`
- `keyword`

欄位命名規則：
- request 用 snake_case
- 前端 store 可保留 camelCase，但 API adapter 必須負責轉換

---

## 5. Summary API

Method:
- `GET /api/dinecore/staff/reports/summary`

Query:
- 使用共用 filters contract

Response:

```json
{
  "summary": {
    "business_date": "2026-03-03",
    "gross_sales": 214,
    "paid_amount": 0,
    "unpaid_amount": 214,
    "order_count": 1,
    "completed_order_count": 0,
    "cancelled_order_count": 0,
    "average_order_value": 214
  },
  "status_breakdown": {
    "pending": 0,
    "preparing": 1,
    "ready": 0,
    "picked_up": 0,
    "cancelled": 0
  },
  "payment_breakdown": {
    "cash": 0,
    "counter_card": 0,
    "other": 0,
    "unpaid": 1
  },
  "top_items": [
    {
      "item_id": "seaweed-noodle-signature",
      "item_name": "經典海藻涼麵",
      "quantity": 1,
      "gross_sales": 154
    }
  ]
}
```

---

## 6. Orders API

Method:
- `GET /api/dinecore/staff/reports/orders`

Query:
- 使用共用 filters contract

Response:

```json
{
  "orders": [
    {
      "order_id": "demo-order",
      "order_no": "DC202603030001",
      "table_code": "A01",
      "created_at": "2026-03-03 22:16:00",
      "status": "preparing",
      "payment_status": "unpaid",
      "payment_method": "unpaid",
      "total_amount": 214,
      "item_count": 2,
      "staff_note_summary": "櫃台已轉交廚房製作"
    }
  ]
}
```

---

## 7. Export API

第一版正式 API 建議保留兩種路徑，至少實作其中一種：

方案 A：
- `GET /api/dinecore/staff/reports/orders`
- 前端自行轉 CSV

方案 B：
- `GET /api/dinecore/staff/reports/export`
- 後端直接回 CSV / 檔案串流

目前前端已採方案 A。  
若後端未準備好檔案下載 API，先維持方案 A 即可。

---

## 8. Error Contract

建議錯誤碼：
- `STAFF_SESSION_REQUIRED`
- `STAFF_ROLE_FORBIDDEN`
- `INVALID_REPORT_FILTERS`
- `REPORTS_DATE_RANGE_INVALID`
- `REPORTS_EXPORT_UNAVAILABLE`

格式建議：

```json
{
  "code": "STAFF_ROLE_FORBIDDEN",
  "message": "目前帳號沒有查看營運報表的權限。"
}
```

---

## 9. 前後端對齊要求

正式後端若落地，前端 `reports` 不應需要改動：
- route
- store state shape
- service 邏輯責任

允許調整的只有：
- `reportsApi.js` 的 endpoint
- snake_case / camelCase mapping
- export 下載模式

---

## 10. 遷移順序建議

1. 先實作 `GET /staff/reports/summary`
2. 再實作 `GET /staff/reports/orders`
3. 前端 `reportsApi.js` 切到 real API
4. 最後再決定是否補 `export` 專用 endpoint
