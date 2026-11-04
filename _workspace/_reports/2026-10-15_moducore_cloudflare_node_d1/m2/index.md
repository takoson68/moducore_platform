# M2 API／Schema 盤點索引

## 範圍

`m2/` 保存舊 PHP/MySQL API 路由與資料表的一次性靜態盤點產物，屬歷史研究資料，不是現行 Worker API 規格或 D1 Schema。

## 閱讀順序

1. 先讀 [`README.md`](./README.md) 了解盤點限制、已知差異與產生方式。
2. API 契約候選讀 `API_MATRIX.md`，逐路由證據讀 `routes.json`。
3. Schema 候選讀 `TABLE_MIGRATION.md` 與 `tables.json`。
4. `fixtures.json` 是推導的合成案例，不代表已執行測試；`inventory.mjs` 是產生器，執行前確認輸出不會覆蓋使用者資料。

## 權限

本索引不授權執行舊 SQL、遠端 Migration、資料庫寫入或把候選資料當正式契約。
