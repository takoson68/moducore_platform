---
name: dinecore-api-smoke-check
description: 對 dineCore 核心 API 做快速健康檢查（guest/staff/login/session），用於判斷是資料庫錯誤、授權錯誤、還是代理設定錯誤。
---

# DineCore API Smoke Check

## 何時使用

- 使用者回報「整站怪怪的」
- 出現 500/401/404，但還不確定問題層級
- 部署後要做快速回歸檢查

## 前置條件

- 後端可連（`moducore_platform.test` 或指定 base URL）
- 資料庫已啟動

## 固定檢查清單

1. Guest API
- `GET /api/dinecore/entry-context?table_code=A01`
- `GET /api/dinecore/order-tracker?order_id=1`

2. Auth API
- `POST /api/login`（`X-Project: dineCore`）
- `GET /api/session?token=...`（帶 `X-Project: dineCore`）

3. Staff API（帶 token query）
- `GET /api/dinecore/staff/tables?token=...`
- `GET /api/dinecore/staff/kitchen/orders?token=...`

## 判讀規則

- `500`：優先檢查 DB schema / migration
- `401`：優先檢查 token、staff profile、tenant
- `404`（在前端 dev server）：優先檢查 proxy target
- `403`：角色限制正常生效（非系統故障）

## 輸出格式

- Endpoint
- Status code
- 摘要（前 1-2 行 body）
- 初步根因判斷
