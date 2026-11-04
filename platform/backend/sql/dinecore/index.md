# Legacy DineCore SQL 索引

## 範圍

本目錄保存歷史 PHP/MySQL dineCore Migration、seed、備份與資料庫操作參考；不適用 Cloudflare D1/SQLite。

## 閱讀順序

1. 先讀 [`../../index.md`](../../index.md) 的 Legacy Backend 邊界。
2. 確認具體 SQL 檔案是 Migration、Seed、Backup 還是操作說明，再比對 PHP controller 需求與實際資料庫版本。
3. Worker/D1 任務改讀 `platform/worker/migrations/` 與 Worker 測試，不轉跑此處 MySQL SQL。

## 重大安全警告

`覆蓋資料庫流程.md` 包含 `DROP DATABASE` 的破壞性範例，只是歷史操作說明；**不可直接執行**。任何資料刪除或重建須有明確目標、備份／還原驗證及使用者明確授權。本索引本身不授權任何 SQL 執行。
