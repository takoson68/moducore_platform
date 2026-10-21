# Release Console Access Contract

本文件定義版本控制台未來加入寫入操作時的身份、授權、重新驗證與稽核邊界。它只固定 M7-1 契約，不授權建立部署、回退、取消或刪除端點。

## 1. 操作員身份來源

- 操作員身份唯一來源為 GitHub 帳號的不可變 `id` 與當下 `login`。
- 不沿用 dineCore、project-b 或其他 Project 的 `users`／`authStore`，避免業務租戶角色取得平台發布權。
- 後端必須驗證 GitHub 身份及 `takoson68/moducore_platform` Repository 權限；瀏覽器傳來的 `login`、`role`、`repositoryPermission` 不具權威性。
- 角色由伺服器端白名單配置；未列入白名單、身份無法驗證或 Repository 權限不足時，一律拒絕。
- GitHub 憑證、OAuth Secret、Session Secret 與 Workflow Token 只能存在受控後端 Secret，不得進入瀏覽器或稽核內容。

有效角色是「白名單角色」與「Repository 權限上限」的交集：

| Repository 權限 | 最高控制台角色 |
|---|---|
| 無／未知 | 無權 |
| `read`、`triage` | Viewer |
| `write`、`maintain` | Deployer |
| `admin` | Admin |

若白名單指定 Admin，但 GitHub 當下只有 `write`，有效角色必須降為 Deployer；不得快取舊權限繼續操作。

## 2. 權限矩陣

| 能力 | Viewer | Deployer | Admin |
|---|---:|---:|---:|
| 查看 Snapshot、Release、Deployment、Audit | ✓ | ✓ | ✓ |
| 下載 Release ZIP | ✓ | ✓ | ✓ |
| 部署既有正式 Tag |  | ✓ | ✓ |
| 回退到 verified previous |  | ✓ | ✓ |
| 取消尚未開始的操作 |  | ✓ | ✓ |
| 刪除非 current／previous 的 Release 或 Artifact |  |  | ✓ |
| 管理操作員白名單 |  |  | ✓，且不得經一般控制台直接修改 |

所有寫入能力仍必須通過 M7-2 Workflow Gate；角色允許不等於可以直接呼叫 Cloudflare 或 GitHub 寫入 API。

## 3. 重新驗證與二次確認

- `deploy`、`rollback`、`cancel`：GitHub 身份驗證時間不得超過 15 分鐘，並輸入完整確認字串 `<action>:<project>:<tag>`。
- `delete_release`、`delete_artifact`：只限 Admin，身份驗證時間不得超過 5 分鐘，先顯示不可恢復影響，再輸入完整確認字串 `<action>:<project>:<tag>`。
- 重新整理、按鈕點擊、瀏覽器 localStorage 或前端倒數計時不得延長驗證期限。
- 後端必須重新核對身份、角色、Repository 權限、Project、Tag、current／previous 與確認字串；前端隱藏按鈕不是授權控制。
- current 不可刪除；previous 預設不可刪除。此限制即使 Admin 也不能繞過，除非後續契約明確建立新的安全回退點流程。

## 4. 不可變稽核事件

每次寫入要求無論 `queued`、`rejected`、`running`、`success`、`failed` 或 `cancelled` 都必須新增事件，不得覆寫舊事件。最低欄位：

- `schemaVersion`、`eventId`、`occurredAt`、`requestId`、`operationId`。
- `actor.provider`、`actor.id`、`actor.login`、`actor.role`、`actor.repositoryPermission`。
- `action`、`project`、`target`。
- `source.tag`、`source.version`、`source.commit`、`source.deploymentId`、`source.cloudflareVersionId`。
- `destination.tag`、`destination.version`、`destination.commit`。
- `result`、`reasonCode`、`workflowRunId`、`githubDeploymentId`、`cloudflareVersionId`。

稽核內容禁止保存 Token、Cookie、Password、Authorization Header、OAuth Code、完整 IP 或其他可重放憑證。`reasonCode` 使用固定機器代碼；詳細內部錯誤留在受控伺服器 Log。

## 5. 人工修改位置

M7-2 實作身份橋接時，操作員白名單的人工維護位置固定為 `platform/release-console/access-policy.json`，不得放在前端 JavaScript、HTML 或 localStorage。

- 檔案只保存 GitHub 數字 `id`、當下 `login`、指定角色及啟用狀態，不保存任何憑證。
- 修改後必須經 Git Commit 留痕並重新啟動受控後端。
- M7-1 不預先建立真實白名單檔案；在 M7-2 身份驗證與讀取實作完成前，系統維持無寫入端點、無操作員授權狀態。

機器可執行的能力矩陣、有效角色、重新驗證與稽核形狀位於 `platform/release-console/access-policy.mjs`。
