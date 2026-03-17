# 每日IP訪客統計書

## 目的

用最小成本記錄每日訪客進站情況，方便觀察是否有人來看履歷頁，並能判斷是否命中我指定的履歷入口來源。

本功能第一版不做完整流量分析，也不做公開前端顯示。  
查詢功能只保留給本專案超級管理員使用。

## 需求整理

- 記錄訪客 IP
- 記錄今日日期
- 記錄訪客實際進入的是哪一頁
- 記錄是否命中指定入口來源代號
- 記錄首次進站時間
- 記錄最後一次進站時間
- 記錄同一天同一條件下的進站次數
- 一般前端不顯示
- 只有本專案超級管理員可查看查詢頁與菜單連結

## 可行性

此需求可行，而且適合做成「每日彙總記錄」。

第一版不需要做完整來源分析，也不需要依賴 referer。  
只要能回答以下問題就夠了：

- 今天有沒有 IP 進到履歷頁
- 這次是否來自我指定的入口連結
- 同一個 IP 今天進來了幾次

這樣的做法簡單、可控、低成本，符合最小可行版本。

## 來源判斷方式

第一版的來源判斷，不使用 referer 作為主要依據。  
改用「網址參數代號」判斷是否命中指定入口來源。

### 規則

- 只要網址帶有指定參數代號，就視為指定來源流量
- 若未帶指定代號，則視為一般直接流量

例如：

- `?k=9d2f`

後端只需要判斷：

- 若 `k === 9d2f`，則判定為指定來源
- 否則視為一般直接流量

### 命名原則

第一版不要使用太明顯的參數名稱，例如：

- `src=104`
- `from=104`

改用外觀看起來不明顯、沒有明確語意的短代號，例如：

- `k=9d2f`

### 設計目的

這樣做的原因不是要建立完整來源分析系統，而是：

- 以最小成本判斷履歷頁是否有來自指定入口的訪問
- 避免參數名稱過於明顯，讓外人一眼看出網站正在做來源追蹤

這是一個可控、簡單、低成本的第一版方案。

## path 與來源代號的區別

這兩個欄位不是同一件事，文件中要明確分開：

- `path`：代表訪客目前實際請求的頁面路徑
- `k=9d2f` 這類參數：代表是否命中指定入口來源

### path 的用途

`path` 不是把資料補到網址裡，而是記錄訪客目前看的頁面。

後端可由 `REQUEST_URI` 解析出目前頁面的 path，例如：

- `/`
- `/resume`
- `/portfolio`

path 的目的，是讓統計資料知道訪客實際看的是哪一頁。  
若未來只想觀察履歷頁，只要查：

- `path = '/resume'`

即可。

### path 正規化規則

第一版建議 `path` 一律只存純路徑值，不含 query string。

例如：

- `/resume?k=9d2f` 入庫後應統一為 `/resume`
- `/portfolio?x=1` 入庫後應統一為 `/portfolio`

這樣可以避免：

- `/resume?k=9d2f`
- `/resume`

被誤當成兩個不同頁面。

## 建議資料表

建議表名：

- `site_visit_daily`

建議欄位：

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

### 欄位說明

- `path`
  - 記錄訪客實際看的頁面路徑
  - 第一版可用 `VARCHAR(255)`
- `source_tag`
  - 記錄本次是否命中指定來源代號
  - 第一版可用 `VARCHAR(32)`
  - 建議值：
    - `tagged`
    - `direct`

若未來想改成布林語意，也可以換成：

- `is_tagged_source`

但第一版先以 `source_tag` 為主，不要過度擴充。

### source_tag 白名單規則

第一版請限制 `source_tag` 只允許以下兩種值：

- `tagged`
- `direct`

不要允許任意字串直接寫入，避免之後累積髒值。

## 唯一索引

原本若只有：

- `visit_date + ip_address`

已不足以符合新需求。

第一版建議改為：

- `visit_date + ip_address + path + source_tag`

這樣才能正確區分：

- 同一 IP 今天是否真的有看履歷頁
- 同一 IP 今天是否帶指定代號進站
- 同一 IP 今天是否在不同頁面留下紀錄

## 建議 SQL 草案

```sql
CREATE TABLE site_visit_daily (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  visit_date DATE NOT NULL,
  ip_address VARCHAR(45) NOT NULL,
  path VARCHAR(255) NOT NULL,
  source_tag VARCHAR(32) NOT NULL DEFAULT 'direct',
  visit_count INT UNSIGNED NOT NULL DEFAULT 1,
  first_visited_at DATETIME NOT NULL,
  last_visited_at DATETIME NOT NULL,
  created_at DATETIME NOT NULL,
  updated_at DATETIME NOT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uniq_visit_daily (visit_date, ip_address, path, source_tag),
  KEY idx_visit_date (visit_date),
  KEY idx_path (path),
  KEY idx_source_tag (source_tag)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

`VARCHAR(45)` 可支援 IPv4 與 IPv6。

## 記錄規則

每次進站時，後端應取得：

- IP
- 今日日期
- path
- 是否命中指定來源代號

其中：

- 若 `k === 9d2f`，則 `source_tag = 'tagged'`
- 否則 `source_tag = 'direct'`

### 寫入規則

同一天 + 同一 IP + 同一 path + 同一 source_tag 視為同一筆。

若已存在：

- `visit_count = visit_count + 1`
- 更新 `last_visited_at`

若不存在：

- 新增一筆
- `visit_count = 1`
- `first_visited_at = last_visited_at = 現在時間`

這樣才能正確分辨：

- 同一 IP 今天是否真的有看履歷頁
- 是否是帶指定來源代號進站

## 指定參數名稱與代號集中設定

第一版雖然只使用一組參數規則，但仍建議集中設定，不要把：

- `k`
- `9d2f`

寫死在多個檔案。

建議做法：

- 放在單一設定檔
- 或放在單一常數定義

這樣之後若要更換代號，只需要改一個地方，不會漏改。

## 建議記錄位置

第一版請明確寫死：

- 只掛在履歷頁或指定入口頁的後端請求流程

不要模糊寫成首頁或所有入口都可。  
更不要掛在每支 API。

原因很簡單：

- 避免同一次進站因多支 API 被重複灌資料
- 只保留真正有意義的入口紀錄

## 建議 PHP 函式行為

函式職責只做一件事：

- `recordDailyVisitorIp(string $ipAddress, string $path, string $sourceTag): void`

建議內部流程：

- 驗證 IP 是否有效
- 取得今天日期
- 正規化 path
- 判斷來源代號是否命中
- 以唯一條件做 upsert 或先查後更

若資料庫支援，也可直接使用：

- `INSERT ... ON DUPLICATE KEY UPDATE`

這樣會比先查再更新更乾淨。

## IP 取得注意事項

不能只假設 `REMOTE_ADDR` 永遠正確。

若網站未來有使用：

- Cloudflare
- Nginx reverse proxy
- 其他 CDN / proxy

就要依部署環境判斷是否讀取：

- `HTTP_CF_CONNECTING_IP`
- `HTTP_X_FORWARDED_FOR`
- `REMOTE_ADDR`

目前若部署單純，可先以 `REMOTE_ADDR` 為主。

## 超級管理員查看方案

此功能只給本專案使用，且只允許超級管理員查看。

本專案目前指定的超級管理員帳號為：

- `tenant_id = dineCore`
- `username = tako`

### 規則

- 只有 `dineCore / tako` 可查看每日IP訪客統計頁面
- 只有 `dineCore / tako` 會看到菜單導航上的「每日IP訪客統計」連結
- 其他帳號即使是 manager 也不可看

### 登入 API 判斷方式

第一版可直接在本專案登入 API 內比對：

- `tenant_id === 'dineCore'`
- `username === 'tako'`

若兩者同時成立，則回傳：

- `isSuperAdmin = true`

### 權限保護注意事項

查詢 API 的權限判斷必須由後端依登入 session / token 重新驗證。  
不可只依賴前端傳來的 `isSuperAdmin`。

也就是：

- 前端控制連結是否顯示
- 後端控制實際查詢權限

兩邊都要做。

## 查詢頁建議規則

### 預設排序

查詢頁第一版建議預設排序為：

1. `visit_date DESC`
2. `last_visited_at DESC`

這樣查資料時會比較直覺，能先看到最近日期、最近活動的紀錄。

### 預設查詢範圍

第一版建議只提供這三種查詢範圍：

- 今日
- 近 7 日
- 近 30 日

先不要一開始就做全表查詢，避免資料量變大後查詢體驗變差。

## 建議排除項目

為了避免自己測試灌髒資料，正式實作時可考慮排除：

- `127.0.0.1`
- `::1`
- 內網 IP
- 自己固定的測試 IP

這部分不是第一版必要，但可保留為簡單補強。

## 第一版範圍

第一版只需要完成：

- 建表
- 後端記錄函式
- 掛在指定頁入口
- 後端權限保護查詢

第一版先不要加入：

- referer 分析
- user agent 分析
- bot 判斷
- 圖表
- 匯出 CSV
- 地區解析

這些都不屬於目前必要範圍。

## 後續可擴充方向

- 增加 referer 分析
- 增加 user agent 記錄
- 增加 bot 判斷
- 增加圖表介面
- 增加 CSV 匯出
- 增加地區解析
- 增加資料保留期限，例如只保留 90 天或 180 天

## 結論

此需求最合理的第一版，不是做完整流量系統，而是做一個最小可行的每日訪客記錄。

目前建議方向是：

- 只記錄履歷頁或指定入口頁的進站
- 以 IP、日期、path、source_tag 做每日彙總
- 來源判斷以網址參數代號為主，不依賴 referer
- `source_tag` 只區分 `tagged` 與 `direct`
- 查詢功能只給 `dineCore / tako`
- 查詢 API 必須由後端依 session / token 再次驗權

這樣成本低、規則清楚、可直接實作，也保留未來擴充空間。
