# Release Console Data Contract

本文件定義唯讀版本控制台的資料邊界。控制台只呈現由 GitHub Releases、GitHub Deployments、GitHub Actions 與 Cloudflare Deployments 交叉取得的證據，不以瀏覽器 localStorage、畫面排序或人工輸入推測線上版本。

## 1. 權威來源

| 資料 | 權威來源 | 用途 |
|---|---|---|
| Project 與固定 Target | Repository 白名單 | 限制可顯示與可操作範圍 |
| 版本、Tag、Commit | Git Tag／Release manifest | 識別不可變版本 |
| ZIP、manifest、checksum | GitHub Release assets | 保存不可變成品 |
| current／previous、Smoke、Run | GitHub Deployments | 保存通過全部 Gate 的部署順序 |
| 實際 Worker Version | Cloudflare Deployments | 與 Deployment payload 交叉核對 |
| 最近失敗 | GitHub Actions Runs | 顯示未成為 current 的失敗嘗試 |

GitHub Deployment 最新 `success` 且 `payload.smoke = passed` 的紀錄為 current；最新 `inactive` 且曾成功、Smoke 通過的紀錄為 previous。失敗 Run 或資料不完整不得移動兩者。

## 2. Snapshot 根結構

```text
ReleaseConsoleSnapshot
├─ schemaVersion: 1
├─ generatedAt: ISO-8601
├─ status: healthy | degraded | unavailable
├─ sources
│  ├─ githubDeployments: ok | unavailable
│  ├─ githubReleases: ok | unavailable
│  ├─ githubActions: ok | unavailable
│  └─ cloudflareDeployments: ok | unavailable
├─ projects[]
└─ issues[]
```

`generatedAt` 是查詢時間，不是發布時間。任何來源不可用時必須保留來源狀態及 issue，不得將空陣列解讀為「沒有版本」。

## 3. Project

每個 Project 必須包含：

- `key`：Tag 使用的穩定鍵，`game-demo`、`dinecore`、`project-b`。
- `project`：manifest 使用的 Project 名稱。
- `target`：固定 Cloudflare Worker 名稱。
- `environment`：GitHub Deployment Environment。
- `stagingUrl`：固定 Staging URL。
- `database`：是否綁定 D1。
- `status`：`healthy`、`degraded` 或 `unavailable`。
- `currentDeploymentId`、`previousDeploymentId`：允許為 `null`，不得由前端自行補值。
- `deployments`、`releases`、`issues`。

## 4. Deployment

Deployment 必須保留：

- `id`、`position`（`current | previous | historical`）、`status`、`createdAt`。
- `project`、`target`、`version`、`tag`、`sourceRef`、`commit`。
- `cloudflareVersionId` 與 `environmentUrl`。
- `runUrl`、`releaseUrl`。
- `artifactSource`（`build | release`）。
- `artifactName`、`zipSha256`、`minimumSchemaVersion`。
- `smoke`（`passed | failed | unknown`）。

Git Tag、GitHub Release、GitHub Deployment 與 Cloudflare Version 是四個不同識別，不得合併成單一「版本 ID」。

## 5. Release 與 Artifact

Release 必須包含 `tag`、`version`、`commit`、`releaseUrl`、`publishedAt` 與 `artifact`。Artifact 必須包含：

- ZIP、manifest、checksum 的名稱、URL、大小與 GitHub digest（若有）。
- `zipSha256`、`manifestSchemaVersion`、`fileCount`、`minimumSchemaVersion`。
- `completeness`：`complete | missing_assets | duplicate_assets | unavailable`。
- `integrity`：`verified | checksum_failed | manifest_invalid | not_checked | unavailable`。

只有三個必要資產各一份、Tag／Project／Target 一致，且 checksum 與逐檔 Hash 驗證成功時，才可標示 `complete + verified`。

## 6. 問題與降級狀態

`issues[]` 每筆包含 `code`、`severity`（`warning | error`）、`source`、`message`、`occurredAt`。固定代碼至少包含：

- `SOURCE_UNAVAILABLE`：遠端來源無法查詢。
- `CURRENT_MISSING`：沒有可驗證的 current。
- `RELEASE_INCOMPLETE`：必要資產缺失或重複。
- `CHECKSUM_FAILED`：ZIP checksum 不一致。
- `MANIFEST_INVALID`：manifest 格式或內容不一致。
- `CLOUDFLARE_VERSION_MISMATCH`：current payload 與實際 Worker Version 不一致。
- `SMOKE_FAILED`：最近部署 Smoke 失敗。
- `RUN_FAILED`：最近 Workflow 失敗，但未移動 current。

狀態規則：

- `healthy`：所有必要來源可用、current 可驗證、Artifact 完整且 Cloudflare Version 一致。
- `degraded`：仍有可驗證 current，但存在來源缺失、最近失敗或證據不一致。
- `unavailable`：無法證明 current，或 GitHub Deployments 無法查詢。

## 7. 安全與顯示原則

- Snapshot 不得包含 GitHub Token、Cloudflare Token、Cookie、密碼或完整請求 Header。
- 瀏覽器 localStorage 只能保存非權威的 UI 偏好，不得保存 current／previous 或寫入憑證。
- 私有 Repository 與 Cloudflare 查詢必須由受控後端執行；瀏覽器只讀取已裁切的 Snapshot。
- UI 必須顯示「未知／無法查詢」，不得將 `null`、逾時或 403 顯示成成功或零筆版本。
- 時間欄位均使用 ISO-8601 UTC，畫面可另行本地化但不得覆寫原值。

機器可執行的白名單、列舉值與基本形狀位於 `platform/worker/scripts/release-console-contract.mjs`。
