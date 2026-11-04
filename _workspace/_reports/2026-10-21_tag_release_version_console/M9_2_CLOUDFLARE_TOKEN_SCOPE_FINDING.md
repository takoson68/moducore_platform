# M9-2 Cloudflare Token 權限範圍盤點

日期：2026-10-22
狀態：待使用者裁決；尚未建立 Token／GitHub Secret，未部署 Production。

## 本機唯讀盤點結果

- `wrangler whoami` 目前只列出一個可用 Cloudflare Account；`wrangler d1 list` 顯示 Production 兩個 D1 與 Staging D1 均在該帳戶。
- Production D1 尚為空白，Migration 未套用。因此若改用獨立帳戶，可在新帳戶建立新的 Production D1 並更新 Wrangler database IDs；不需搬移應用資料。已存在的舊空 D1 可先保留，待新部署驗收後再由使用者決定是否刪除。
- D1 官方支援 `wrangler d1 export --remote` 匯出 SQL，並用 `wrangler d1 execute <target> --remote --file <dump.sql>` 匯入其他目標資料庫。跨帳戶操作需由有權存取來源與目的帳戶的本機登入／操作員完成；不應把這種跨帳戶權限 Token 留在 GitHub。

## 官方權限要求

- Cloudflare Workers 文件指出：既有 Worker 可指定該 Worker 範圍的 `Editor`；建立尚不存在的 Worker 則需要涵蓋帳戶所有 Worker 的產品層級 `Admin`。Wrangler OAuth 登入不支援這類細分 Workers 權限，API Token 才支援。
- Cloudflare API Token policy 的資源類型是 User、Account、Zone；`D1 Edit` 是 Account permission，不支援把 Token 綁到單一 D1 ID。因此，只要 GitHub Workflow 持有 `D1 Edit`，就可操作該帳戶中其他 D1，包括 Staging D1。
- 本專案 Production 與 Staging Worker／D1 目前位於同一 Cloudflare Account。Environment 人工核准可限制何時執行 Workflow，但不能縮小 Token 的權限範圍。

## 可選路徑

1. **建議：Production 使用獨立 Cloudflare Account。** 將 Production D1 與 Worker 都放在獨立帳戶，Token 以該帳戶為唯一資源範圍；Workers 建立所需 Admin 仍只涵蓋 Production 帳戶。代價是建立／管理另一個帳戶，並更新 account ID、Wrangler 綁定與正式資源佈建流程。
2. **留在同帳戶，但把 D1 Migration 改為人工操作。** GitHub 只持有發布到已存在 Production Workers 的 per-Worker `Editor` Token，不持有 `D1 Edit`。D1 Migration／備份等需由管理者使用既有登入，在核准後依 Production config 手動執行；Workflow 不得操作 Staging Worker，但失去全自動 Migration。首次建立 Worker 仍須先由管理者決定安全的資源佈建流程。
3. **留在同帳戶並自動 Migration，接受明確較廣風險。** Workflow 需要 Workers Admin（首次建立）及 D1 Edit（Account scope），會具備操作同帳戶 Staging Worker／D1 的能力。建立 Workers 後可將 Workers Admin 輪替為每個 Production Worker 的 Editor，但 D1 Edit 仍無法縮小到特定 Production D1。Environment 核准不會縮小 Token 權限。

尚未採取任何路徑。未裁決前不建立 Token、不寫 GitHub Secret、不啟用 Production Workflow、不建立 `prod_*` Tag。

## 官方資料

- [Cloudflare Workers roles and permissions](https://developers.cloudflare.com/workers/authorization/)
- [Cloudflare API token permissions](https://developers.cloudflare.com/fundamentals/api/reference/permissions/)
- [Cloudflare create tokens via API（Token 資源限定為 User／Account／Zone）](https://developers.cloudflare.com/fundamentals/api/how-to/create-via-api/)
- [Cloudflare D1 匯入與匯出](https://developers.cloudflare.com/d1/best-practices/import-export-data/)
