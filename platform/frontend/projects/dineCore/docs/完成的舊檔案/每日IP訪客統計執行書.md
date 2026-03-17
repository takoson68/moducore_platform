# 每日IP訪客統計執行書

更新日期：2026-03-10  
目標：依《每日IP訪客統計書》落地最小可行版本，完成每日 IP 訪客記錄、指定來源代號判斷、後端受保護查詢，以及超級管理員可見的查詢入口。

## 0. 本次實作範圍

第一版只做以下內容：

1. 建立 `site_visit_daily` 資料表
2. 建立後端記錄函式
3. 在指定頁入口掛入記錄流程
4. 建立後端查詢 API
5. 查詢 API 加上超級管理員權限保護
6. 前端只對 `dineCore / tako` 顯示「每日IP訪客統計」連結與查詢頁

本次不做：

- referer 分析
- user agent 分析
- bot 判斷
- 圖表
- CSV 匯出
- 地區解析

---

## 1. 資料表工程

### 1.1 建表

新增資料表：

- `site_visit_daily`

欄位：

- `id`
- `visit_date`
- `ip_address`
- `path`
- `source_tag`
- `visit_count`
- `first_visited_at`
- `last_visited_at`
- `created_at`
- `updated_at`

### 1.2 索引規則

唯一索引改為：

- `visit_date + ip_address + path + source_tag`

目的：

- 區分同一 IP 在同一天是否看不同頁
- 區分是否命中指定來源代號

### 1.3 欄位規則

- `path`
  - 只存純路徑值
  - 不含 query string
- `source_tag`
  - 第一版只允許：
    - `tagged`
    - `direct`

摰點：

- SQL migration 或 SQL 腳本需可重跑或至少可清楚重建

---

## 2. 共用常數與設定

### 2.1 指定來源代號集中設定

不要把以下內容散落在多個檔案：

- 參數名稱 `k`
- 指定代號 `9d2f`

建議集中在單一設定檔或常數：

- `TRACKING_QUERY_KEY = 'k'`
- `TRACKING_QUERY_VALUE = '9d2f'`

### 2.2 source_tag 集中定義

建議同樣集中定義：

- `SOURCE_TAG_TAGGED = 'tagged'`
- `SOURCE_TAG_DIRECT = 'direct'`

摰點：

- 後端判斷與查詢不可各自手寫字串

---

## 3. 後端記錄流程

### 3.1 記錄函式

新增後端函式，責任只做每日訪客記錄：

- 取得 IP
- 取得今天日期
- 解析 path
- 判斷是否命中來源代號
- 依唯一條件寫入或累加

建議函式型態：

```php
recordDailyVisitorIp(string $ipAddress, string $path, string $sourceTag): void
```

### 3.2 path 正規化

寫入前先做 path 正規化：

- `/resume?k=9d2f` -> `/resume`
- `/portfolio?x=1` -> `/portfolio`

目標：

- 避免 `/resume?k=9d2f` 與 `/resume` 被當成兩頁

### 3.3 source_tag 判斷

後端規則：

- 若 `k === 9d2f` -> `source_tag = 'tagged'`
- 否則 -> `source_tag = 'direct'`

### 3.4 寫入規則

同一天 + 同一 IP + 同一 path + 同一 source_tag 視為同一筆。

若資料已存在：

- `visit_count + 1`
- 更新 `last_visited_at`

若資料不存在：

- 建立新資料
- `visit_count = 1`
- `first_visited_at = last_visited_at = 現在時間`

摰點：

- 建議優先用 `INSERT ... ON DUPLICATE KEY UPDATE`

---

## 4. 記錄觸發點

### 4.1 掛載位置

第一版請明確只掛在：

- 履歷頁
- 或指定入口頁

不要掛在：

- 所有頁面
- 所有入口
- 每支 API

### 4.2 原因

- 避免同一次進站被多支 API 重複灌資料
- 只保留真正有意義的入口紀錄

摰點：

- 必須先確認本專案的實際履歷入口檔案或 controller 位置

---

## 5. 後端查詢 API

### 5.1 API 目的

提供超級管理員查詢每日 IP 訪客統計。

第一版只做基本查詢，不做圖表與匯出。

### 5.2 查詢欄位

至少包含：

- `visit_date`
- `ip_address`
- `path`
- `source_tag`
- `visit_count`
- `first_visited_at`
- `last_visited_at`

### 5.3 預設排序

查詢頁預設排序：

1. `visit_date DESC`
2. `last_visited_at DESC`

### 5.4 預設查詢範圍

第一版只提供：

- 今日
- 近 7 日
- 近 30 日

先不要做全表查詢。

摰點：

- API 回傳需對應這三種時間範圍條件

---

## 6. 權限保護

### 6.1 超級管理員規則

本專案第一版超級管理員固定為：

- `tenant_id = dineCore`
- `username = tako`

### 6.2 登入 API 判斷

登入成功後，於本專案登入 API 判斷：

- `tenant_id === 'dineCore'`
- `username === 'tako'`

符合時回傳：

- `isSuperAdmin = true`

### 6.3 查詢 API 驗權

查詢 API 不可只信任前端傳來的 `isSuperAdmin`。

必須由後端根據：

- session
- token
- 當前登入使用者

重新驗證是否為 `dineCore / tako`。

摰點：

- 前端隱藏連結不等於權限保護

---

## 7. 前端工程

### 7.1 菜單導航顯示規則

前端只在以下條件成立時顯示：

- `isSuperAdmin === true`

顯示項目：

- 「每日IP訪客統計」連結

其他帳號：

- 看不到此連結

### 7.2 查詢頁

第一版查詢頁只需支援：

- 顯示列表
- 顯示時間範圍切換
- 顯示基本欄位

先不要做：

- 圖表
- 匯出
- 進階篩選

摰點：

- 前端只負責顯示與切換條件，不負責真正權限判斷

---

## 8. 工程里程碑

### M1 資料結構完成

- [x] 建立 `site_visit_daily`
- [x] 補上 `path`
- [x] 補上 `source_tag`
- [x] 建立唯一索引 `visit_date + ip_address + path + source_tag`

完成判定：

- 資料表可建立
- 可手動 insert 測試資料

### M2 記錄核心完成

- [x] 集中定義 `k` 與 `9d2f`
- [x] 集中定義 `tagged` / `direct`
- [x] 完成 path 正規化
- [x] 完成 source_tag 判斷
- [x] 完成 upsert 寫入邏輯

完成判定：

- 同一條件重複進站會累加 `visit_count`
- 不同 path 或不同 source_tag 會分開記錄

### M3 指定入口掛載完成

- [x] 找到履歷頁或指定入口頁
- [x] 掛入記錄函式
- [x] 確認不會因 API 重複灌資料

完成判定：

- 實際進站會落資料
- 同一次進頁不會產生異常重複筆數

### M4 查詢 API 與權限完成

- [x] 建立查詢 API
- [x] 實作 `dineCore / tako` 驗權
- [x] 限制查詢範圍為今日 / 近 7 日 / 近 30 日
- [x] 預設排序為 `visit_date DESC`、`last_visited_at DESC`

完成判定：

- 只有 `tako` 能查
- 非 `tako` 會被拒絕

### M5 前端查詢頁完成

- [x] 加入「每日IP訪客統計」頁面
- [x] 菜單導航僅對超級管理員顯示連結
- [x] 接上查詢 API
- [x] 顯示基本統計列表

完成判定：

- `tako` 看得到連結與頁面
- 其他帳號看不到連結

---

## 9. 驗證方式

1. 使用帶 `?k=9d2f` 的指定入口頁進站
2. 確認資料表新增：
   - 正確 `path`
   - `source_tag = tagged`
3. 使用不帶代號的入口進站
4. 確認資料表新增：
   - 相同 `path`
   - `source_tag = direct`
5. 同一日重複進入相同條件頁面
6. 確認只累加 `visit_count`
7. 使用 `tako` 查詢
8. 使用非 `tako` 帳號查詢

摰點：

- 驗證時要特別確認 `/resume?k=9d2f` 入庫後的 `path` 仍為 `/resume`

---

## 10. 目前建議開工順序

1. 先做資料表
2. 再做記錄函式
3. 再掛指定入口
4. 再做查詢 API
5. 最後補前端查詢頁與菜單顯示

這樣可以讓工程中途就看得到進度，也能在每個里程碑結束時先做單點驗證。
