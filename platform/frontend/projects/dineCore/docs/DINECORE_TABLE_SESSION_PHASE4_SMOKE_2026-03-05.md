# DINECORE_TABLE_SESSION_PHASE4_SMOKE_2026-03-05

測試日期：2026-03-05
環境：`http://127.0.0.1:8081`、DB `moducore_platform`

## 測試範圍

1. 同桌併發掃碼是否只會使用同一張 open order。
2. `paid` 後是否會建立新 order。
3. `sessions/clear` 是否只清指定桌號，並關閉該桌 active table session。

## 測試步驟與結果

## Case A：同桌併發掃碼（A01）

1. 先呼叫一次 `GET /api/dinecore/entry-context?tableCode=A01`，取得 `order_before=7`。
2. 併發 6 次同 URL 呼叫（模擬多裝置同時進入）。
3. 回傳 `order_id` 皆為 `7`（同單）。

結果：`PASS`

## Case B：關單後重建

1. 以 staff token 呼叫  
`POST /api/dinecore/staff/counter/update-payment-status`  
payload: `{"order_id":7,"payment_status":"paid"}`
2. 再次呼叫 `GET /api/dinecore/entry-context?tableCode=A01`
3. 回傳 `order_after_paid=8`（與 7 不同）

結果：`PASS`

## Case C：單桌清理 scope

1. 以 staff token 呼叫  
`POST /api/dinecore/staff/sessions/clear`  
payload: `{"table_code":"A01"}`
2. API 回傳 `scope=table`、`tableCode=A01`。
3. DB 驗證：
  - `dinecore_guest_sessions` 在 A01 的 active 筆數 = `0`
  - `dinecore_table_sessions` 在 A01 的 active 筆數 = `0`

結果：`PASS`

## Case D：防誤清全店

1. 呼叫 `POST /api/dinecore/staff/sessions/clear` 不帶 `table_code`
2. 回傳 `VALIDATION_FAILED / TABLE_CODE_REQUIRED`

結果：`PASS`

## 結論

本次 Phase 4 smoke 顯示：

1. 同桌併發掃碼已避免雙開單。
2. 關單後可正確重建新 order。
3. session 清理已收斂為單桌 scope，並禁止未帶桌號的全店清理。
