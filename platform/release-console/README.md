# ModuCore 版本控制台

本機管理面會從 GitHub Releases、GitHub Deployments、GitHub Actions 與 Cloudflare Deployments 建立 Snapshot。瀏覽器只呼叫本機 Node 後端；後端以已登入的 GitHub CLI 查詢資料，並透過固定的 `deploy-staging.yml` 執行受控版本部署，不讓瀏覽器接觸寫入憑證。

## 啟動

需求：Node.js 20 以上、已登入且有 Repository 權限的 `gh` CLI、符合 `access-policy.json` 的操作員，以及可讀取三個 Staging Worker 的 Wrangler 登入狀態。管理頁的部署由 GitHub Actions 使用 Staging Environment Secret；本機不需要 Cloudflare 寫入 Token。

```bash
cd platform/release-console
npm test
npm run check
npm start
```

瀏覽器開啟 `http://127.0.0.1:4190/`。如需改 Port，可設定 `RELEASE_CONSOLE_PORT`；Host 固定綁定本機回環位址，不接受環境變數改成區網或公開介面。

## 顯示內容

- 三個固定 Project 與 Staging 網址。
- 經 Smoke 驗證的 current／previous Deployment。
- Tag、版本、Commit、Workflow、部署時間與 Cloudflare Version ID。
- Release ZIP、manifest、checksum 的完整性與 Hash 驗證。
- 最近一次 Project Workflow 若失敗，顯示失敗摘要。
- GitHub Release ZIP 下載入口。

管理頁可部署已驗證 Release 或回退至 previous。操作會觸發 GitHub Actions，並輪詢 queued／running／success／failed 狀態；部署 Smoke 通過後 Snapshot 顯示更新後的 current／previous。權威資料契約位於 `_VibeCore/engineering/RELEASE_CONSOLE_CONTRACT.md`。

身份與權限依 `_VibeCore/engineering/RELEASE_CONSOLE_ACCESS_CONTRACT.md`：GitHub 不可變 ID 白名單、Repository 權限上限、Viewer／Deployer／Admin 能力、逐次重新驗證、完整確認字串及 append-only Audit。操作員白名單位於 `access-policy.json`；後端以 `gh` CLI 取得身份與權限。

受控橋接位於 `github-identity.mjs` 與 `workflow-bridge.mjs`：只接受三個 Project 的正式部署 Tag，固定透過 `deploy-staging.yml` 使用 Release 原件，並以 Operation ID 追蹤 queued／running／success／failed。`access-policy.json` 是人工維護位置；修改 GitHub ID、login、role 或 enabled 後需 Commit 留痕。控制台預設使用這個受控 adapter；只有明確設定 `RELEASE_CONSOLE_MODE=simulation` 才會切換成不改變線上的模擬模式。

操作 UI 與受控 POST API 可部署 verified Release 或回退 previous；每次都重新解析 GitHub 身份與 Snapshot，並要求完整確認字串。後端只使用固定 Project／Tag 與 Release 原件，不接受任意 Branch／Commit，也不直接連接 Cloudflare 寫入 API。真實模式不提供 Release 刪除。

M8-3 的 `retention-policy.mjs` 另加上保存 Gate：Release 預設永久、Actions Artifact 維持 7 天、每個 Project 至少保留 3 個 verified Release，且發布後 30 天內禁止刪除。容量警戒只產生評估結果，不會自動刪除或啟用 R2；完整政策見 `_VibeCore/engineering/RELEASE_RETENTION_POLICY.md`。

預設 `controlled` 模式會呼叫 Staging Workflow；每次部署仍須登入 GitHub、符合白名單、重新驗證並輸入完整確認字串。`RELEASE_CONSOLE_MODE=simulation` 僅供本機介面／測試，不會呼叫 Workflow。Workflow 部署只會在全部測試、Migration 相容性（適用時）、部署及 Smoke Gate 通過後更新 current／previous。

## 安全邊界

- GitHub／Cloudflare 的登入狀態只由本機 Node 程序及 CLI 使用，不進入 HTML、JavaScript、Snapshot 或 localStorage。
- HTTP 只接受回環 Host；寫入 API 限 same-origin JSON，並由後端重新驗證身份、角色、版本及確認字串；其他 Method 拒絕。
- Snapshot 在送出前會拒絕 Token、Secret、Password、Authorization 與 Cookie 類欄位或已知憑證字串。
- 遠端命令錯誤只回傳固定訊息，不將 CLI stderr、路徑或帳號資訊送進瀏覽器。
- 私有 Repository 若未來啟用，仍只能由本機 `gh` CLI 身份讀取；瀏覽器不直接呼叫 GitHub API。
- 此版本以本機作業系統使用者及回環介面作為讀取邊界，不可直接發布到公網。公開服務需在後續階段先加入身份驗證與允許欄位裁切。
