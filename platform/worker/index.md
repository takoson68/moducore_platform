# Cloudflare Worker Backend Index

## 範圍

`platform/worker/` 是 Cloudflare Workers JavaScript + D1/SQLite 的目標後端實作區，包含 API、Migration、測試、Smoke、封裝與部署設定。此處有程式不代表整個舊 PHP API 已完成移植。

## 任務閱讀路由

1. API／Auth／Session：從 `src/index.js`、`src/auth.js`、`src/credentials.js` 與 `test/` 對應契約進入；語意邊界另讀 `_VibeCore/api/index.md`。
2. Project 資料／Migration：先讀 `migrations/` 中目標 Project 相關 SQL、`wrangler.<project>-<environment>.json` 及 Migration 測試；不得直接對遠端套用。
3. Smoke／佈建：按需讀 `scripts/` 及 `_VibeCore/engineering/` 對應 Identity/Access、部署 Contract。
4. Release／Tag／版本狀態：先讀 `_VibeCore/engineering/index.md`，再讀 `TAG_DEPLOYMENT_MANUAL.md`、Release Contract 與其測試。
5. 可執行命令以 [`package.json`](./package.json) 為準；修改後執行對應測試與 `npm run check`（若其受影響）。

## 安全邊界

- D1 Schema 不隨 Worker 回退；Migration 與資料回復是不同操作。
- 不把 Secrets 寫入文件、命令輸出、Snapshot 或 Git。
- Production 資源不在目前興趣專案 Staging 發布授權內；任何 Production／資料操作必須重新確認範圍與權限。
- 任何部署需由根 `AGENTS.md` 的部署路由與正式 Engineering 流程進入，不直接以 `wrangler deploy` 繞過 Gate。
