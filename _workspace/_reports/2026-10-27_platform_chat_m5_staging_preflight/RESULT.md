# M5 Staging 部署前隔離驗收

測試日期：2026-10-27

## 結果

- `https://game-demo-staging.takoson68.workers.dev/` 目前回應 HTTP 200，入口可存取。
- `platform/worker/test/chat-poc.test.mjs` 4/4 通過，包含不同 room 不互相廣播與不同 projectId 公共頻道隔離。
- 本輪沒有建立新 Deployment，也沒有向公開聊天室送出測試訊息。

## 尚未完成

目前 `game-demo-staging` 尚未確認已包含本輪 Chat 移植成品；需要建立新的 `dep_game-demo_v<版本>` Tag 或使用已授權的手動 Staging 部署，部署後再做兩個公開房間的真實 WebSocket 隔離 smoke。
