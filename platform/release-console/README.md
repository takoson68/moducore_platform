# ModuCore 版本控制台

本機管理面會從 GitHub Releases、GitHub Deployments、GitHub Actions 與 Cloudflare Deployments 即時建立唯讀 Snapshot。瀏覽器只呼叫本機 `/api/release-console`，不保存或接觸 GitHub／Cloudflare Token。

## 啟動

需求：Node.js 20 以上、已登入的 `gh` CLI，以及可讀取三個 Staging Worker 的 Wrangler 登入狀態。

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

本階段沒有部署、回退、上傳、刪除或版本切換 API。權威資料契約位於 `_VibeCore/engineering/RELEASE_CONSOLE_CONTRACT.md`。

M7-1 已固定未來寫入操作的 GitHub 身份、Viewer／Deployer／Admin、重新驗證及稽核契約，詳見 `_VibeCore/engineering/RELEASE_CONSOLE_ACCESS_CONTRACT.md`。目前只存在可測試的 policy 函式，仍未建立身份登入、操作員白名單或寫入端點。

M7-2 的受控橋接位於 `github-identity.mjs` 與 `workflow-bridge.mjs`：只接受三個 Project 的正式部署 Tag，固定透過 `deploy-staging.yml` 使用 Release 原件，並以 Operation ID 追蹤 queued／running／success／failed。`access-policy.json` 是人工維護位置；修改 GitHub ID、login、role 或 enabled 後需 Commit 留痕。這個真實 adapter 尚未接到 HTTP 或畫面。

M7-3 已加入本機操作 UI 與受控 POST API，可選擇 verified Release、回退 previous、取消 queued Operation，以及選取一至二十筆非 current／previous Release 做批次刪除。後端每次都重新解析 GitHub 身份與 Snapshot，並要求完整確認字串；瀏覽器提供的角色、Commit、來源版本及保護狀態不具權威性。

M8-3 的 `retention-policy.mjs` 另加上保存 Gate：Release 預設永久、Actions Artifact 維持 7 天、每個 Project 至少保留 3 個 verified Release，且發布後 30 天內禁止刪除。容量警戒只產生評估結果，不會自動刪除或啟用 R2；完整政策見 `_VibeCore/engineering/RELEASE_RETENTION_POLICY.md`。

目前固定為醒目標示的 `simulation` 模式：操作狀態及 `data/audit.ndjson` 會更新，但不會呼叫 GitHub Workflow、刪除 Release 或變更 Cloudflare。正式部署／回退 adapter 與真實刪除維護 Workflow 必須分別取得明確授權後才可啟用，不能只靠畫面切換模式。

## 安全邊界

- GitHub／Cloudflare 的登入狀態只由本機 Node 程序及 CLI 使用，不進入 HTML、JavaScript、Snapshot 或 localStorage。
- HTTP 只接受回環 Host 與 `GET`；所有 `POST`、`PUT`、`PATCH`、`DELETE` 均回傳 `405 READ_ONLY`。
- Snapshot 在送出前會拒絕 Token、Secret、Password、Authorization 與 Cookie 類欄位或已知憑證字串。
- 遠端命令錯誤只回傳固定訊息，不將 CLI stderr、路徑或帳號資訊送進瀏覽器。
- 私有 Repository 若未來啟用，仍只能由本機 `gh` CLI 身份讀取；瀏覽器不直接呼叫 GitHub API。
- 此版本以本機作業系統使用者及回環介面作為讀取邊界，不可直接發布到公網。公開服務需在後續階段先加入身份驗證與允許欄位裁切。
