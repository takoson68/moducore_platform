# DINECORE_AUDIT_CLOSE_API_CONTRACT

更新日期：2026-03-03

## 1. 用途

本文件定義 `dineCore` `audit-close` 模組進入正式後端 API 時的最小契約。

目標：
- 固定關帳摘要、歷史、關帳、解鎖的 request / response shape
- 把 mock 階段已存在的鎖定規則帶進正式後端
- 讓 `counter / kitchen / reports` 能依同一套關帳狀態行為運作

---

## 2. 模組邊界

`audit-close` 負責：
- 關帳
- 解鎖
- 關帳摘要
- 稽核歷史
- 鎖定範圍

`audit-close` 不負責：
- 訂單主資料 CRUD
- 付款收款流程
- 報表 UI

---

## 3. 授權與路由範圍

前端 route：
- `/staff/manager/audit-close`

後端權限：
- `manager`

若未來要開放 `deputy_manager` 只讀，應另外設計 read-only policy，不可直接放寬寫入端點。

未授權時應回：
- HTTP `403`
- code: `STAFF_ROLE_FORBIDDEN`

未登入時應回：
- HTTP `401`
- code: `STAFF_SESSION_REQUIRED`

---

## 4. Summary API

Method:
- `GET /api/dinecore/staff/audit-close/summary`

Query:

```json
{
  "business_date": "2026-03-03"
}
```

Response:

```json
{
  "closing_summary": {
    "business_date": "2026-03-03",
    "gross_sales": 214,
    "paid_amount": 0,
    "unpaid_amount": 214,
    "order_count": 1,
    "unfinished_order_count": 1,
    "close_status": "open",
    "closed_at": "",
    "closed_by": ""
  },
  "blocking_issues": [
    {
      "type": "unpaid_orders",
      "label": "仍有未付款訂單",
      "count": 1,
      "order_ids": ["demo-order"]
    }
  ],
  "lock_state": {
    "business_date": "2026-03-03",
    "is_locked": false,
    "locked_scopes": []
  }
}
```

---

## 5. History API

Method:
- `GET /api/dinecore/staff/audit-close/history`

Query:

```json
{
  "business_date": "2026-03-03"
}
```

Response:

```json
{
  "history": [
    {
      "id": "audit-close-001",
      "business_date": "2026-03-03",
      "action": "close",
      "actor_name": "店長",
      "actor_role": "manager",
      "created_at": "2026-03-03 23:10:00",
      "reason": "正常日結",
      "reason_type": "daily_close",
      "affected_scopes": ["orders", "payments"],
      "before_status": "open",
      "after_status": "closed"
    }
  ]
}
```

---

## 6. Close API

Method:
- `POST /api/dinecore/staff/audit-close/close`

Request:

```json
{
  "business_date": "2026-03-03",
  "reason_type": "daily_close",
  "reason": "完成日結，準備交班"
}
```

Response:
- 可直接回 `summary` 同 shape
- 或回最小成功結果再由前端重新拉 summary

建議最小成功結果：

```json
{
  "business_date": "2026-03-03",
  "close_status": "closed"
}
```

---

## 7. Unlock API

Method:
- `POST /api/dinecore/staff/audit-close/unlock`

Request:

```json
{
  "business_date": "2026-03-03",
  "reason_type": "correction",
  "reason": "需修正付款狀態"
}
```

限制：
- `reason` 必填
- `reason_type` 必填

建議最小成功結果：

```json
{
  "business_date": "2026-03-03",
  "close_status": "reopened"
}
```

---

## 8. 關帳鎖定規則

正式後端必須承接以下規則：

- 已關帳營業日不得更新訂單狀態
- 已關帳營業日不得更新付款狀態
- 解鎖前不得重開編輯

這表示以下端點在已關帳營業日上必須回錯誤：
- `counter/update-order-status`
- `counter/update-payment-status`
- `kitchen/update-order-status`

建議錯誤碼：
- `BUSINESS_DATE_LOCKED`

格式建議：

```json
{
  "code": "BUSINESS_DATE_LOCKED",
  "message": "這個營業日已關帳，無法再更新訂單或付款狀態。"
}
```

---

## 9. Error Contract

建議錯誤碼：
- `STAFF_SESSION_REQUIRED`
- `STAFF_ROLE_FORBIDDEN`
- `AUDIT_CLOSE_BLOCKED`
- `BUSINESS_DATE_ALREADY_CLOSED`
- `BUSINESS_DATE_NOT_CLOSED`
- `UNLOCK_REASON_REQUIRED`
- `BUSINESS_DATE_LOCKED`

其中：
- `AUDIT_CLOSE_BLOCKED` 表示仍有 blocking issues
- `BUSINESS_DATE_LOCKED` 主要給 `counter / kitchen` 這類操作模組接收

---

## 10. 前後端對齊要求

正式後端若落地，前端 `audit-close` 不應需要改動：
- route
- store 結構
- page 顯示欄位
- error handling 流程

允許調整的只有：
- `auditCloseApi.js` 的 endpoint
- snake_case / camelCase mapping

---

## 11. 遷移順序建議

1. 先實作 `GET /staff/audit-close/summary`
2. 再實作 `GET /staff/audit-close/history`
3. 再實作 `POST /staff/audit-close/close`
4. 再實作 `POST /staff/audit-close/unlock`
5. 最後將 `counter / kitchen` 的更新端點補上 `BUSINESS_DATE_LOCKED`
