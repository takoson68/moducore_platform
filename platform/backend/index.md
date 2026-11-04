# Legacy Backend Index

## 範圍

`platform/backend/` 是既有 PHP 8 + PDO/MySQL API、靜態資產與舊 Migration 的參考實作。它用來比對既有契約、資料模型與行為；依目前轉換方向，新 API 目標為 `platform/worker/` 的 Cloudflare Workers + D1。

## 閱讀順序

1. [`README.md`](./README.md) 了解舊目錄與歷史啟動方式；其中命令或環境路徑若過時，須以目前 Repository 設定驗證。
2. 依任務進入 `public/api.php`、`src/routes.php`、`src/Controllers/`、`src/Core/` 或相應 `api/<project>/`。
3. SQL 任務才讀 `sql/` 對應 Project Migration；備份檔不可當 Migration 執行。
4. 將舊行為與新 Worker route、D1 schema、測試契約逐項比對後，才能判定移植完成。

## 邊界

- 不在舊 PHP 後端擴充新功能，除非使用者明確改變平台方向。
- 不因找到 PHP 實作就推定 Worker 已等價；也不因 Worker 有檔案就推定所有 API 已移植。
- 本索引不授權資料庫寫入、Migration、遠端部署或資料刪除。
- `sql/dinecore/` 含歷史重建流程文件；執行前必讀該層索引，不能因文件存在就執行刪庫指令。
