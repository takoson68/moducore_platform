# DINECORE_TABLE_SESSION_FLOW_EXECUTION_PLAN

最後更新：2026-03-05

## 1. 目標

將 dineCore 點餐流程收斂為以下模型：

1. `table` 是長壽資源（桌號永久存在）。
2. `table session` 是桌次容器（每桌同時間最多一個 active）。
3. `order` 是交易週期（結帳後關閉並入帳）。
4. `guest session` 是顧客識別（掃碼即發 token，掛在當前 order 下）。

你要的效果：

1. 新顧客掃同桌 QR，若該桌已有進行中 order，直接加入同單。
2. 結帳關單後，該桌的客戶佔位（guest sessions）會被清空。
3. 下次新掃碼會開新桌次/新 order，不會疊加舊顧客。

## 2. 目前風險與隱患

## 2.1 併發建立雙訂單

問題：
同桌同時兩支手機掃碼，可能都判斷「沒有 open order」，造成同桌產生多筆 open order。

補強：
1. 建立 `dinecore_table_sessions`，並對 `table_code + status=active` 做唯一約束（可用 generated column 或明確 active flag）。
2. 在 `entry-context` 走交易鎖定流程：先 lock table session，再判斷/建立 order。

## 2.2 Token 重放與跨桌污染

問題：
舊 token 被帶回、或 token/table 不一致，可能污染桌次。

補強：
1. 每次 `entry-context` 驗證 `guest_session.table_code == request.table_code`。
2. 驗證 `guest_session.order_id` 對應 order 仍為 open，否則強制 `expired`。
3. token 加入 `last_seen_at` + TTL 策略（例如 8~12 小時）。

## 2.3 關單不完整造成殘留

問題：
若關單流程只更新 order，未同步 guest/table session，會看到顧客持續疊加。

補強：
1. 關單必須在同一 transaction 內完成：
`order -> paid/closed`、`guest_sessions -> expired`、`table_session -> closed`。
2. 任一步驟失敗整筆 rollback。

## 2.4 前端清理與後端真實狀態不一致

問題：
只清前端 token/localStorage 會掩蓋畫面，不會清 DB 顧客佔位。

補強：
1. 「清空 Session」只做後端 DB 清理（已調整方向）。
2. 前端只刷新資料，不直接刪除後端真實狀態。

## 2.5 顧客識別混淆

問題：
連號顧客編號會累積跳號，造成員工/顧客混淆。

補強：
1. 使用 `桌號-短碼`（例如 `A12-K7Q`）作為 `display_label`。
2. 僅在同 order 內保證唯一，不要求全域唯一。

## 3. 目標資料模型

## 3.1 新增資料表：`dinecore_table_sessions`

欄位建議：
1. `id`
2. `table_code` (FK -> `dinecore_tables.code`)
3. `order_id` (FK -> `dinecore_orders.id`)
4. `status` (`active|closed`)
5. `started_at`
6. `closed_at`
7. `created_at`
8. `updated_at`

索引建議：
1. `idx_table_sessions_table_code`
2. `idx_table_sessions_order_id`
3. `ux_table_sessions_active_table`（每桌最多一個 active）

## 3.2 既有表維持

1. `dinecore_orders`：交易主體，仍保留。
2. `dinecore_guest_sessions`：顧客 token 會話，掛在 `order_id`。
3. `dinecore_order_batches`：加點批次，維持現行。

## 4. API/流程改造

## 4.1 `GET /api/dinecore/entry-context`

改造後流程（transaction）：
1. 用 `table_code` 鎖定該桌 session（FOR UPDATE）。
2. 若有 active table session -> 取其 `order_id`。
3. 若無 -> 建立新 order + 新 table session(active)。
4. 驗證來訪 token：
  - 合法且同桌同 open order -> 復用 guest session。
  - 其他情況 -> expire 舊 token，建立新 guest session。
5. 回傳 `ordering_session_token`、`ordering_label`、`order_id`。

## 4.2 `POST /api/dinecore/checkout-submit`

改造後流程（transaction）：
1. 批次送單/結單邏輯完成。
2. 支付完成時更新：
  - `dinecore_orders` -> `paid/closed`
  - `dinecore_guest_sessions` -> `expired`
  - `dinecore_table_sessions` -> `closed`

## 4.3 `POST /api/dinecore/staff/sessions/clear`

建議語意：
1. 預設只清指定桌（必帶 `table_code`）。
2. 全店清空需更高權限與二次確認。
3. 回傳 `cleared_count`、`scope`、`actor`。

## 5. 前端改造重點

1. 顧客端只持有自己的 `ordering_session_token`。
2. 進入 `entry` 必走 `entry-context`，不在前端自行推導 order。
3. 「清空顧客 Session」按鈕只打後端 API，再刷新畫面。
4. 顧客顯示使用後端回傳 `display_label`，不在前端自編號。

## 6. 分階段執行計畫

## Phase 0：防呆與可觀測（0.5 天）

1. 統一 log 欄位：`table_code`、`order_id`、`session_token`、`actor`。
2. 補齊錯誤碼：`TABLE_SESSION_LOCK_FAILED`、`ORDER_ALREADY_CLOSED`、`SESSION_TABLE_MISMATCH`。

## Phase 1：Schema 與 migration（0.5~1 天）

1. 新增 `dinecore_table_sessions` migration。
2. 補索引/唯一約束。
3. 寫回填腳本（若存在 open order，補一筆 active table session）。

## Phase 2：Backend 核心流程（1~1.5 天）

1. 改 `entry-context` 為 transaction + lock。
2. 改 checkout close flow 一次性關閉 order/guest/table session。
3. staff clear API 改為預設單桌清理。

## Phase 3：Frontend 對齊（0.5~1 天）

1. 管理端清理按鈕加入 `table_code` scope。
2. 顧客端重新掃碼/重進流程與錯誤提示對齊新錯誤碼。
3. 顧客標籤全站統一用後端 `display_label`。

## Phase 4：驗收與回歸（0.5 天）

1. 同桌雙機同時掃碼，不得產生兩張 open order。
2. 結帳後再掃碼，必為新 order。
3. 清理指定桌 session，不影響其他桌。
4. 舊 token 不得跨桌復用。

## 7. 驗收測試案例（最小集合）

1. Case A：首位顧客掃碼
  - 預期：建立 table session(active) + order(open) + guest session(active)。

2. Case B：第二位顧客同桌掃碼
  - 預期：同一 `order_id`，新增 guest session。

3. Case C：同桌雙機同時掃碼（壓測）
  - 預期：僅一筆 open order。

4. Case D：完成結帳
  - 預期：order 關閉、guest sessions 全 expired、table session closed。

5. Case E：關單後再次掃碼
  - 預期：建立新 order、新 table session、新 guest session。

## 8. 上線與回滾

上線：
1. 先上 schema + backward-compatible code。
2. 再切換 `entry-context` 到 table-session 流程。
3. 最後開啟 strict 檢查（token/table/order 一致性）。

回滾：
1. 保留舊邏輯 feature flag：`DINECORE_TABLE_SESSION_MODE=off`。
2. 若事故，關閉 flag 回退至舊 `open order by table` 模式。

## 9. 本次結論

此流程可行，且是比「連號顧客」更穩定的模型。  
要真正防止顧客疊加與資料競態，關鍵不是前端清 token，而是：
1. `table session` 唯一 active 約束
2. `entry-context` 交易鎖
3. `checkout` 一次性關閉 order + sessions
