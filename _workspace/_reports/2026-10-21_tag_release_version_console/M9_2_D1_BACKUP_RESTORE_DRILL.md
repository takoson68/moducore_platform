# M9-2 Production D1 備份與還原演練

日期：2026-10-22
範圍：Migration 前空白 D1 基線；未部署 Worker、未套 Migration、未寫入正式 D1。

## 正式資料庫基線

| 資料庫 | ID | 區域 | 表數 | 體積 | 24 小時讀／寫 |
|---|---|---:|---:|---:|---:|
| `dinecore-production-db` | `2893f276-ae35-4944-8022-bb2a9bb3524c` | APAC | 0 | 12 KB | 0／0（匯出後讀計數 1） |
| `project-b-production-db` | `282acec5-29e9-4c1d-9c7f-0a079d592722` | APAC | 0 | 12 KB | 0／0 |

## 備份檔與完整性

備份位於本目錄子資料夾 `production-backups/2026-10-22/`。檔案僅含 Wrangler 匯出的空白庫指令，權限設為檔案唯本人讀寫、目錄唯本人可進入。

| 檔案 | 大小 | SHA-256 |
|---|---:|---|
| `dinecore-production-pre-migration.sql` | 32 bytes | `309d1516f5d4f4f792b17106f7b761312f848c634e3028d70e6eb8ed39df7398` |
| `project-b-production-pre-migration.sql` | 32 bytes | `309d1516f5d4f4f792b17106f7b761312f848c634e3028d70e6eb8ed39df7398` |

## 還原演練

1. 在 APAC 建立暫存 D1 `dinecore-production-restore-drill-20261022`（ID `22131723-a2ef-4a3f-a195-526c14c23ea7`），匯入 dineCore 備份。
2. `wrangler d1 execute --remote --file` 成功；回讀 `d1 info` 得到 0 張表、12 KB。
3. 在 APAC 建立暫存 D1 `project-b-production-restore-drill-20261022`（ID `0fffb9e8-6379-4d52-a81b-a933ac637cb5`），匯入 project-b 備份。
4. 匯入成功；回讀得到 0 張表、12 KB。
5. 兩個暫存庫均由本輪建立，演練完成後以 Wrangler 明確刪除；再列舉資料庫，確認只剩原有 Production 與 Staging D1。
6. 最後再次讀取 Production D1：兩者仍為 0 張表、12 KB；無 Migration／資料寫入。

## 容量判斷與限制

當前每庫 12 KB；Cloudflare D1 官方單庫限制為 Free 500 MB、Workers Paid 10 GB，故空白基線遠低於任一方案限制。這不是負載／吞吐量測試，也沒有判定 Cloudflare 帳戶目前的計費方案。

此演練只驗證「Migration 前空白基線 SQL 可匯入新建隔離 D1」。尚未驗證包含 Migration schema、觸發器、索引或應用資料的正式備份還原；須在建立可代表正式資料結構的隔離副本後再補。空白基線備份也不能代替日常備份與 Cloudflare Time Travel。
