# ModuCore Tag 部署操作手冊

## 1. 使用目的

一般 Commit 與 Push 只保存工程進度，不會部署。只有符合規格的部署 Tag，或 GitHub Actions 的手動救援操作，才會改動 Staging。

## 2. 支援的專案與 Tag

| 專案 | Tag 格式 | 部署目標 |
|---|---|---|
| game-demo | `dep_game-demo_vX.Y.Z` | `game-demo-staging` |
| chatCore | `dep_chatcore_vX.Y.Z` | `chatcore-staging` |
| dineCore | `dep_dinecore_vX.Y.Z` | `dinecore-staging` |
| project-b | `dep_project-b_vX.Y.Z` | `project-b-staging` |
| platform-chat | `dep_platform-chat_vX.Y.Z` | `moducore-chat-poc-staging` |

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
6. `game-demo` 另開啟 Staging 遊戲頁，確認畫面右上角版本膠囊顯示 `vX.Y.Z` 並與剛推送的 Tag 版本一致；若仍是舊版，先強制重新整理並檢查建置，不要只以 Actions 成功或 HTTP 200 宣告畫面版本驗收通過。

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
- `chatCore`：建置獨立 chatCore Project，部署 Static Assets 與 Private Chat Lab Signaling Durable Object；執行 SPA 與 Signaling Smoke，不執行 D1 Migration 或 Auth Smoke。
- `dineCore`：執行 D1 Migration、公開端點及 Auth 隔離驗證。
- `project-b`：除 D1 與 Auth 外，另執行 Employee Smoke。

任一測試、建置、dry-run、Migration 或 Smoke Test 失敗，Workflow 必須停止，不能宣告部署完成。

### 6.1 D1 Schema 相容 Gate

dineCore 與 project-b 的正式版本 manifest 必須包含 `minimumSchemaVersion`。此值由 Repository 內連續編號的正式 Migration 自動取最新一筆，不接受操作員或 Tag 任意指定。

部署流程會：

1. 讀取遠端 D1 的 `d1_migrations`。
2. 拒絕遠端未知 Migration、編號跳號或不連續狀態。
3. 遠端低於最低需求時，先依正式 Migration 向前升級。
4. Migration 後再次確認遠端已達最低需求，才允許部署 Worker。
5. 遠端高於成品最低需求時保持現況，不執行倒退。

歷史 D1 Release 若沒有 `minimumSchemaVersion`，Release 原件模式會在部署前拒絕。需要回退前端時，必須先確認該版本已具備 Schema 相容資料；禁止修改舊 Release 或重用舊 Tag 來繞過檢查。

## 7. 回退方式

安全回退入口有兩種：版本控制台的「回退 previous」會部署已驗證的 Release ZIP 原件；若控制台不可用，可用 GitHub Actions 手動救援，選擇相同 Project 並在 `ref` 填入上一版 Tag。後者會從上一版的確切 Commit 重新建置、驗證及部署。

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

### 7.2 從 GitHub Actions 重部署歷史 ZIP

1. 進入 `Actions` → `Deploy staging` → `Run workflow`。
2. `target` 選擇 Tag 所屬的單一 Project。
3. `ref` 填入完整歷史 Tag，例如 `dep_game-demo_v0.1.1`。
4. `artifact_source` 選擇 `release`。
5. `simulate_failure` 保持關閉後執行。

Release 原件模式會跳過前端依賴安裝、Build 與重新封裝，直接下載 Release 的 ZIP、manifest 與 checksum。安全驗證成功後才把原件內的 `site/` 放入固定 Target，依序執行 Wrangler dry-run、Worker 測試、部署與 Smoke Test。全部成功後才新增 GitHub Deployment 並移動 current／previous。

`target` 與 Tag Project 不一致、Release 不完整、Hash 不符或安全解壓失敗時，Workflow 會在部署前停止。

## 8. 版本控制台部署／回退

版本控制台位於 `platform/release-console`，可部署已驗證 Release 或回退 previous。控制台部署會呼叫既有 Staging Workflow，使用 Release ZIP 原件；不會直接將檔案上傳 Cloudflare，也不需要在瀏覽器輸入 Token。

啟動前需有 Node.js 20+、已登入 `gh` CLI、`access-policy.json` 中啟用的 GitHub 操作員，以及可供 Snapshot 查詢使用的 Wrangler 登入狀態。於 Repository 根目錄執行：

```bash
cd platform/release-console
npm start
```

開啟 `http://127.0.0.1:4190/`。一般情況不要設定 `RELEASE_CONSOLE_MODE=simulation`；該模式只供模擬，不會更新線上 Staging。

### 部署指定版本

1. 在目標 Project 的 Release 清單找到完整性為 `complete` 且 `verified` 的版本。
2. 按該版本的「部署」，確認動作、Project 與 Tag。
3. 輸入畫面提供的完整確認字串，例如 `deploy:game-demo:dep_game-demo_v0.1.1`。
4. 等候操作狀態至 `success`。可由「查看 Workflow」開啟 GitHub Actions；控制台會持續刷新，直到成功部署紀錄成為 current。

### 回退 previous

1. 在 Project 卡片按「回退 previous」。後端會重新確認該版本仍是權威 Snapshot 中的 previous。
2. 輸入完整確認字串，例如 `rollback:game-demo:dep_game-demo_v0.1.0`。
3. 等候 Workflow、Release 原件驗證、dry-run、部署及 Smoke Gate 全部成功；成功後 previous Tag 成為新的 current，原 current 移為 previous。

任何身份、權限、Tag／Project、Release Hash、資料庫 Schema 相容性或 Smoke Gate 失敗，都不得宣告切版成功。控制台只開在本機回環位址，不可直接發布給平板或公開網路使用。批次刪除 Release 不屬於受控部署功能。

一般程式更新仍使用前述部署 Tag 流程：先 Commit／Push 程式，再建立唯一新版本 Tag；普通 Push 不會自動部署。

## 9. 版本證據與安全邊界

GitHub Releases 的 ZIP、manifest 與 checksum 是版本控制台的正式版本目錄。控制台顯示 current、previous、Tag、Commit、Cloudflare Version ID 及 Smoke 狀態；切換操作必須觸發受保護 Workflow，不得把 Cloudflare Token 放在瀏覽器。

`game-demo` 畫面版本膠囊由 Workflow 將 Tag 的 SemVer 注入 `VITE_RELEASE_VERSION` 後於建置時產生。Tag Push 驗收時，須同時核對膠囊版本與控制台／Release Tag；不可在 Vue 畫面寫死版本字串。

部署狀態的正式真相來源是 GitHub Deployments：

- 每個目標使用獨立 Environment 名稱，例如 `staging/game-demo-staging`。
- Workflow 只有在 Build、測試、部署、Smoke Test，以及正式 Tag 的 Release 發布全部成功後，才新增 `success` Deployment。
- Deployment payload 保存 Project、Target、版本、Tag／來源 Ref、Commit、ZIP SHA-256、Cloudflare Version ID、Run URL、Release URL 與 Smoke 結果。
- 同一 Environment 最新一筆 `success` 紀錄是 `current`；GitHub 自動將前一筆成功紀錄標為 `inactive`，其中最新一筆是 `previous`。兩者都必須具有 `smoke: passed` 證據。
- 失敗或中斷的 Workflow 不建立成功 Deployment，因此不得移動 `current`／`previous`。
- 手動救援成功也會新增 Deployment；舊 Tag 重新部署後會成為新的 `current`，但不修改或重用原 Tag。

GitHub Deployments 負責「實際驗證過的部署歷史」，GitHub Releases 負責「不可變版本成品」。Cloudflare Deployments 用於交叉核對線上 Version ID，但控制台不得只靠瀏覽器 localStorage 推測 current／previous。

不得直接修改線上資產或以重用 Tag 的方式假裝切版。
