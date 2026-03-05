---
name: dinecore-db-repair
description: 修復 dineCore 因缺表/缺欄位導致的 500，重點處理 table_sessions、batch schema、staff seed，並做 API 回歸驗證。
---

# DineCore DB Repair

## 何時使用

- `entry-context` / `order-tracker` 出現 500
- 後端報 SQL 錯誤（缺表、缺欄位）
- 新環境初始化後 API 大量失敗

## 標準修復順序

1. 盤點缺失
- `SHOW TABLES LIKE 'dinecore_%'`
- 對照 controller 實際引用表

2. 套 migration（依缺失選擇）
- 基礎：`001_dinecore_base.sql`
- batch：`004_dinecore_phase_a_batch_schema.sql`
- table sessions：`005_dinecore_table_sessions.sql`
- 補欄位：`005a_dinecore_table_sessions_add_guest_state_json.sql`
- staff：`003_dinecore_staff_auth_seed.sql`

3. 結果驗證
- `SHOW COLUMNS FROM dinecore_table_sessions`
- `GET /api/dinecore/entry-context?table_code=A01` 須為 200
- 主要 guest/staff API 冒煙測試

## 輸出

- 套用的 SQL 檔案清單
- 修復前後差異（缺表/欄位 -> 正常）
- 回歸測試結果
