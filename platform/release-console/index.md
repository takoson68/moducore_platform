# Release Console Index

## 範圍

此目錄是供本機操作的 Staging Release 控制台，從 GitHub Release／Deployment／Actions 與 Cloudflare 狀態建立 Snapshot，透過受控 GitHub Workflow 部署已驗證版本或回退 previous。它不是公開網站，也不是任意 Branch/Commit 部署器。

## 閱讀順序

1. 先讀 [`README.md`](./README.md) 了解需求、啟動方式、身分與安全邊界。
2. UI／API／GitHub bridge 任務再進入 `server.mjs`、`console-operations.mjs`、`workflow-bridge.mjs`、`snapshot.mjs` 與對應 `test/`。
3. 授權、資料快照、保存政策依序參考 `_VibeCore/engineering/RELEASE_CONSOLE_ACCESS_CONTRACT.md`、`RELEASE_CONSOLE_CONTRACT.md`、`RELEASE_RETENTION_POLICY.md`。
4. 部署操作依 `_VibeCore/engineering/TAG_DEPLOYMENT_MANUAL.md`；人類操作手冊位置由 `_workspace/範本/index.md` 導讀。

## 安全邊界

- 預設只綁 `127.0.0.1`，不可直接暴露公網或區網。
- 瀏覽器不持有 GitHub／Cloudflare 寫入憑證；寫入操作必須通過身份、權限、完整確認字串與受控 Workflow。
- `RELEASE_CONSOLE_MODE=simulation` 不會修改 Staging；不要把模擬成功當線上部署成功。
- Production、Release 刪除及任意程式碼部署不在此控制台功能／目前授權範圍內。
