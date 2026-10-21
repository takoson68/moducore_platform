# ModuCore 唯讀版本控制台

本機管理面會從 GitHub Releases、GitHub Deployments、GitHub Actions 與 Cloudflare Deployments 即時建立唯讀 Snapshot。瀏覽器只呼叫本機 `/api/release-console`，不保存或接觸 GitHub／Cloudflare Token。

## 啟動

需求：Node.js 20 以上、已登入的 `gh` CLI，以及可讀取三個 Staging Worker 的 Wrangler 登入狀態。

```bash
cd platform/release-console
npm test
npm run check
npm start
```

瀏覽器開啟 `http://127.0.0.1:4190/`。如需改 Port，可設定 `RELEASE_CONSOLE_PORT`；服務預設只綁定本機回環位址，不開放區網。

## 顯示內容

- 三個固定 Project 與 Staging 網址。
- 經 Smoke 驗證的 current／previous Deployment。
- Tag、版本、Commit、Workflow、部署時間與 Cloudflare Version ID。
- Release ZIP、manifest、checksum 的完整性與 Hash 驗證。
- 最近一次 Project Workflow 若失敗，顯示失敗摘要。
- GitHub Release ZIP 下載入口。

本階段沒有部署、回退、上傳、刪除或版本切換 API。權威資料契約位於 `_VibeCore/engineering/RELEASE_CONSOLE_CONTRACT.md`。
