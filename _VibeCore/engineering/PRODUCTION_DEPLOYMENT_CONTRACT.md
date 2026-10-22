---
status: draft
updated: 2026-10-22
scope: production-deployment
activation: prohibited-until-m9-2
---

# Production 發布隔離契約

## 現況與啟用邊界

截至 2026-10-22，Repository 已建立 GitHub `production` Environment 並設定 required reviewer；Production Secrets 尚未建立。Cloudflare 目前只有已驗證的 Staging Worker 與 D1。本文件及 `production-release-plan.mjs` 只定義正式發布邊界，不代表 Production 已可用。

目前 Repository 只有一位 collaborator。`production` reviewer 暫由 `takoson68` 擔任，管理員繞過已關閉，但 GitHub 允許此 reviewer 核准自己發起的發布；此為明確人工 Gate，不是雙人覆核。若需要職責分離，必須先加入另一位可信任 reviewer，再開啟 prevent self-review。

在 M9-2 完成前，禁止建立或推送 `prod_*` Tag，禁止新增會部署 Production 的啟用中 Workflow，也禁止用 Staging Workflow／Secret／Worker／D1 代替正式資源。

## Tag 與單 Project 原則

- 正式格式：`prod_<project>_v<semver>`。
- Project 白名單：`game-demo`、`dinecore`、`project-b`。
- 範例：`prod_game-demo_v1.0.0`。
- `dep_*` 只代表 Staging；普通 Branch Push、`dep_*`、不完整版本或未知 Project 均不得進入 Production。
- 每個 Tag 只發布一個 Project，Tag 不得刪除、移動或重用。

## 強制隔離矩陣

| Project | Production Worker | Production D1 | Staging 對照（禁止重用） |
|---|---|---|---|
| game-demo | `game-demo-production` | 無 | `game-demo-staging` |
| dineCore | `dinecore-production` | `dinecore-production-db` | `dinecore-staging`／`dinecore-staging-db` |
| project-b | `project-b-production` | `project-b-production-db` | `project-b-staging`／`project-b-staging-db` |

- GitHub Environment 固定為 `production`，不得讀取 `staging` Environment Secret。
- Production 必須使用獨立的 Cloudflare API Token／Account 設定；Token 權限只涵蓋正式 Worker 與正式 D1 所需操作。
- Production 使用獨立 `deploy-production.yml`；不得在 Staging Workflow 以布林參數切換正式環境。
- Production concurrency 以正式 Target 為群組，同一 Project 不得併發；不同 Project 可獨立排程。

## 人工核准與啟用 Gate

建立真實 Workflow 前，Repository 管理者必須在 GitHub `production` Environment 設定 required reviewer，並以 API／畫面留下證據。若方案或 Repository 權限不支援 required reviewer，Production 發布維持停用，不得改以無核准 Workflow 規避。

首次啟用必須同時確認：

1. `production` Environment 已存在且有人工核准規則。
2. Production Secrets 已存在，且 Staging Workflow 無法引用。
3. 三個正式 Worker 名稱不與 Staging 相同。
4. dineCore／project-b 使用全新 D1 ID，Wrangler config 不含任何 Staging database ID。
5. 自訂網域或 workers.dev URL 已逐 Project 記錄，Smoke 不使用猜測網址。

## 發布順序

1. 解析並驗證 `prod_*` Tag，Checkout 不可變 Commit。
2. 完成本機測試、Build、manifest、ZIP 與 SHA-256。
3. 人工核准 Production Environment。
4. D1 Project 在任何 Migration 前建立可下載備份，並於隔離臨時資料庫完成還原演練。
5. 檢查 D1 容量、Migration 相容性與只向前規則；禁止自動倒退 Schema。
6. Wrangler dry-run、部署單一 Project、取得 Cloudflare Version ID。
7. 執行 Production Smoke；測試資料必須帶 Run ID，並在 `finally` 清除。清除失敗視為發布失敗並列出精確殘留資料。
8. 全部 Gate 成功後才建立不可變 GitHub Release 與 Production Deployment current／previous 證據。

## 失敗與回復

- Migration、部署或 Smoke 任一步失敗，不得移動 Production current／previous，不得建立成功 Release。
- 靜態／Worker 程式回復使用上一個 verified Production Release 原件；不可拿 Staging Release 冒充 Production 原件。
- D1 不隨前端回退而自動倒退。資料復原只允許依已驗證備份及獨立人工程序執行。
- 首次 Production 發布前必須先證明「上一版回復」路徑；若尚無上一版，需保存部署前空狀態、備份與停機／移除程序。

## M9-2 已建立與尚待佈建

- 已建立 GitHub `production` Environment；required reviewer 為 Repository 管理員 `takoson68`，`can_admins_bypass=false`。目前只有單一 collaborator，因此 prevent self-review 未啟用，使用者可核准自己發起的部署。
- Production 專用 Secrets。
- 三個 Cloudflare Worker；兩個 D1 database 及其實際 ID。
- 正式網址／網域與 Smoke 白名單。
- D1 備份、還原演練及容量證據。
- 完成以上項目後，才產生並啟用 `deploy-production.yml`。
