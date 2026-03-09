# dineCore 資料庫對齊操作文件

## 0. 用途
- 本文件用於將家中環境的 `dineCore` 資料庫一次對齊到目前程式版本。
- 本次對齊重點：
  - 正式送單冪等保護
  - housekeeping / cleanup 控制表
  - 併單紀錄表
  - `table_sessions.order_id` 可為 `NULL`
  - 新增 `dinecore_guest_sessions`

## 1. 需要匯入的 SQL
依序執行以下三個檔案：

1. [006_dinecore_checkout_submission_merge_cleanup.sql](/F:/GitHub/moducore_platform/platform/backend/sql/dinecore/006_dinecore_checkout_submission_merge_cleanup.sql)
2. [007_dinecore_table_sessions_nullable_order.sql](/F:/GitHub/moducore_platform/platform/backend/sql/dinecore/007_dinecore_table_sessions_nullable_order.sql)
3. [008_dinecore_guest_sessions_b1.sql](/F:/GitHub/moducore_platform/platform/backend/sql/dinecore/008_dinecore_guest_sessions_b1.sql)

## 2. 執行前確認
- 確認 MySQL 可連線
- 確認目標 DB 名稱正確
- 建議先做一次 DB 備份

如果你的家中環境和目前本機相同，預設值通常是：
- host: `localhost`
- port: `3306`
- db: `moducore_platform`
- user: `root`
- password: `root`

## 3. 建議執行方式

### 3.1 Windows / XAMPP
在專案根目錄執行：

```powershell
cmd /c "\"C:\xampp\mysql\bin\mysql.exe\" -h localhost -P 3306 -u root -proot moducore_platform < platform\backend\sql\dinecore\006_dinecore_checkout_submission_merge_cleanup.sql"
cmd /c "\"C:\xampp\mysql\bin\mysql.exe\" -h localhost -P 3306 -u root -proot moducore_platform < platform\backend\sql\dinecore\007_dinecore_table_sessions_nullable_order.sql"
cmd /c "\"C:\xampp\mysql\bin\mysql.exe\" -h localhost -P 3306 -u root -proot moducore_platform < platform\backend\sql\dinecore\008_dinecore_guest_sessions_b1.sql"
```

### 3.2 如果帳密不同
把以下片段改成你的環境：

```powershell
-h <db_host> -P <db_port> -u <db_user> -p<db_password> <db_name>
```

## 4. 執行後驗證
執行以下查詢：

```sql
SHOW TABLES LIKE 'dinecore_checkout_submissions';
SHOW TABLES LIKE 'dinecore_housekeeping_jobs';
SHOW TABLES LIKE 'dinecore_order_merge_records';
SHOW TABLES LIKE 'dinecore_guest_sessions';
SHOW CREATE TABLE dinecore_table_sessions;
```

你應該看到：
- `dinecore_checkout_submissions`
- `dinecore_housekeeping_jobs`
- `dinecore_order_merge_records`
- `dinecore_guest_sessions`

另外 `SHOW CREATE TABLE dinecore_table_sessions` 應確認：
- `order_id` 為 `DEFAULT NULL`
- FK `fk_dinecore_table_sessions_order` 為 `ON DELETE SET NULL`

## 5. 功能層驗證
資料庫對齊後，建議最少驗證這幾件事：

1. 掃桌號可正常取得本機身份
2. 菜單加入購物車後，購物車頁可看到品項
3. `checkout-submit` 可成功建立正式訂單
4. 相同 `clientSubmissionId` 重送不會產生第二張正式單
5. 同 session 再加點會建立下一個 submitted batch
6. tracker 可正常讀單
7. staff merge candidates / merge orders 可正常使用

## 6. 對齊後的資料庫語意

### 6.1 正式新增表
- `dinecore_checkout_submissions`
  - 用於 `checkout-submit` idempotency

- `dinecore_housekeeping_jobs`
  - 用於 request-triggered cleanup 控制

- `dinecore_order_merge_records`
  - 用於按鈕式併單紀錄

- `dinecore_guest_sessions`
  - 用於本機身份 / session token / order 綁定
  - 目前主流程已改由這張表承接 guest session

### 6.2 調整中的舊表
- `dinecore_table_sessions`
  - 保留桌號 active/closed 與 current order 上下文
  - `order_id` 必須允許 `NULL`
  - `guest_state_json` 已不再作為主流程資料來源

## 7. 已知注意事項
- `guest_state_json` 目前仍保留欄位，但主流程不應再依賴它
- 舊草稿 cart API 雖仍存在路由，但主流程已改為前端 local cart
- 如果家中 DB 還留有舊測試資料，不影響 migration，但可能影響你人工驗證判讀

## 8. 若驗證失敗，先檢查這些

### 8.1 如果 entry-context 出錯
先查：

```sql
SHOW CREATE TABLE dinecore_table_sessions;
```

通常是：
- `order_id` 仍是 `NOT NULL`
- `007` 沒有成功執行

### 8.2 如果 tracker / session 流程異常
先查：

```sql
SHOW TABLES LIKE 'dinecore_guest_sessions';
```

通常是：
- `008` 沒有成功執行

### 8.3 如果送單重複保護失效
先查：

```sql
SHOW TABLES LIKE 'dinecore_checkout_submissions';
```

通常是：
- `006` 沒有成功執行

## 9. 建議對齊後再做的事
- 跑一次前端 build
- 實際走一輪：
  - 掃桌
  - 加入購物車
  - 送單
  - tracker
  - staff merge

