# Platform 程式子系統索引

## 範圍

`platform/` 保存可執行程式與部署工具，不定義 VibeCore 世界規則。規則與實作有落差時，分別以 `_VibeCore/` 判斷預期，以本目錄各子系統原始碼／設定／測試判斷現況。

## 子系統閱讀路由

| 目錄 | 責任 | 入口 |
|---|---|---|
| `frontend/` | Vue + Vite 前端平台與各 Project | [`frontend/index.md`](./frontend/index.md) |
| `backend/` | 歷史 PHP + MySQL API 與既有行為參考 | [`backend/index.md`](./backend/index.md) |
| `worker/` | Cloudflare Workers + D1 移植、測試、Migration 與部署設定 | [`worker/index.md`](./worker/index.md) |
| `release-console/` | 本機受控 Staging Release 切換／回退工具 | [`release-console/index.md`](./release-console/index.md) |
| `performance/` | 平台／單一 Project 效能評估方法與歷史結果 | [`performance/index.md`](./performance/index.md) |

## 跨子系統規則

- 新前端功能從 `frontend/` 進入；一次 Build 使用一個 `VITE_PROJECT`。
- 新 API／Auth／D1 能力以 `worker/` 為目標；舊 `backend/` 僅用於契約與行為比對，不新增 PHP 業務功能。
- 發布流程由根目錄 `AGENTS.md` 的部署路由導向 `_VibeCore/engineering/AI_WORKFLOW.md` 與正式部署手冊；Release Console 不等於公開管理網站。
- 本索引只負責程式入口，不授予 Commit、Push、部署、資料修改或 Production 操作權限。
