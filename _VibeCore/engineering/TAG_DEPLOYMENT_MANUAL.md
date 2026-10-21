# ModuCore Tag 部署操作手冊

## 1. 使用目的

一般 Commit 與 Push 只保存工程進度，不會部署。只有符合規格的部署 Tag，或 GitHub Actions 的手動救援操作，才會改動 Staging。

## 2. 支援的專案與 Tag

| 專案 | Tag 格式 | 部署目標 |
|---|---|---|
| game-demo | `dep_game-demo_vX.Y.Z` | `game-demo-staging` |
| dineCore | `dep_dinecore_vX.Y.Z` | `dinecore-staging` |
| project-b | `dep_project-b_vX.Y.Z` | `project-b-staging` |

版本必須採三段式，例如 `0.1.0`。需要預發布版本時可使用 `1.0.0-rc.1`。

## 3. 不使用 AI 的正常部署方式

### 3.1 先確認要部署的 Commit

```bash
git status
git log -1 --oneline
```

未 Commit 的內容不會進入部署包。確認目前 Commit 正確後，再建立唯一的新 Tag：

```bash
git tag dep_game-demo_v0.1.0
git push origin dep_game-demo_v0.1.0
```

將 `game-demo` 與版本號換成目標專案及新版本。不可移動、刪除後重用已發布的版本 Tag。

### 3.2 查看執行結果

1. 開啟 GitHub Repository。
2. 進入 `Actions`。
3. 選擇 `Deploy staging`。
4. 開啟由該 Tag 觸發的工作。
5. 確認測試、ZIP、dry-run、部署與 Smoke Test 全部成功。

成功後，Repository 的 `Releases` 會出現相同 Tag，並附帶：

- `*.zip`：可重建部署的靜態成品。
- `*.manifest.json`：Project、Commit、建置時間及逐檔 SHA-256。
- `*.sha256`：完整 ZIP 的 SHA-256。

## 4. GitHub 網頁操作

也可在 GitHub `Releases` 選擇 `Draft a new release`，建立符合規格的新 Tag 並發布。Workflow 若發現該 Release 尚無資產，會在部署成功後補上 ZIP、manifest 與 checksum；若已有資產則拒絕覆寫。

## 5. 手動救援部署

Tag Workflow 無法使用時：

1. 進入 `Actions` → `Deploy staging`。
2. 按 `Run workflow`。
3. 選擇單一 `target`。
4. 在 `ref` 填入 Branch、Tag 或 Commit SHA；留空則使用畫面所選 Branch。
5. `simulate_failure` 保持關閉。
6. 執行並檢查全部 Gate。

手動救援會產生保留七天的 Actions Artifact，但不會建立正式 GitHub Release。

## 6. 專案差異

- `game-demo`：測試、建置、封裝、Static Assets dry-run、部署及 SPA Smoke；不執行 D1 Migration 或 Auth Smoke。
- `dineCore`：執行 D1 Migration、公開端點及 Auth 隔離驗證。
- `project-b`：除 D1 與 Auth 外，另執行 Employee Smoke。

任一測試、建置、dry-run、Migration 或 Smoke Test 失敗，Workflow 必須停止，不能宣告部署完成。

## 7. 回退方式

目前安全回退入口是 GitHub Actions 手動救援：選擇相同 Project，並在 `ref` 填入上一版 Tag。Workflow 會從上一版的確切 Commit 重新建置、驗證及部署。

前端版本回退不代表 D1 Schema 回退。dineCore 或 project-b 若新版包含 Migration，回退前必須確認舊版程式仍相容於目前 Schema；禁止自動倒退 D1 Migration。

### 7.1 驗證歷史 ZIP 原件

需要檢查 Release 中保存的原始成品時，在新的空目錄執行：

```bash
cd platform/worker
output_dir="$(mktemp -d /tmp/moducore-release.XXXXXX)"
node scripts/download-release-package.mjs \
  --tag dep_game-demo_v0.1.0 \
  --repository takoson68/moducore_platform \
  --output "$output_dir"
```

下載器只接受白名單 Project 的合法部署 Tag，並驗證 Release Tag、三個必要資產、ZIP SHA-256、內外 manifest、逐檔 SHA-256 及完整檔案清單。解壓前會拒絕絕對路徑、`..`、反斜線路徑、符號連結、重複 manifest 路徑、過多檔案與異常解壓大小。

此命令只下載及驗證，不會部署。必須由正式 Workflow 使用驗證後的 `site/`，不得手動把未驗證的 ZIP 內容上傳至 Cloudflare。

## 8. 版本控制台銜接

GitHub Releases 的 ZIP、manifest 與 checksum 是未來版本控制台的正式版本目錄。控制台應顯示 current、previous、Tag、Commit、Cloudflare Version ID 及 Smoke 狀態；切換操作必須觸發受保護 Workflow，不得把 Cloudflare Token 放在瀏覽器。

部署狀態的正式真相來源是 GitHub Deployments：

- 每個目標使用獨立 Environment 名稱，例如 `staging/game-demo-staging`。
- Workflow 只有在 Build、測試、部署、Smoke Test，以及正式 Tag 的 Release 發布全部成功後，才新增 `success` Deployment。
- Deployment payload 保存 Project、Target、版本、Tag／來源 Ref、Commit、ZIP SHA-256、Cloudflare Version ID、Run URL、Release URL 與 Smoke 結果。
- 同一 Environment 最新一筆 `success` 紀錄是 `current`；GitHub 自動將前一筆成功紀錄標為 `inactive`，其中最新一筆是 `previous`。兩者都必須具有 `smoke: passed` 證據。
- 失敗或中斷的 Workflow 不建立成功 Deployment，因此不得移動 `current`／`previous`。
- 手動救援成功也會新增 Deployment；舊 Tag 重新部署後會成為新的 `current`，但不修改或重用原 Tag。

GitHub Deployments 負責「實際驗證過的部署歷史」，GitHub Releases 負責「不可變版本成品」。Cloudflare Deployments 用於交叉核對線上 Version ID，但控制台不得只靠瀏覽器 localStorage 推測 current／previous。

在控制台完成前，不得直接修改線上資產或以重用 Tag 的方式假裝切版。
