# 朋友可遠端加入 chatCore M1 實驗

---

## Decision

- M1 以 chatCore 專屬 Staging 網站供少數已知實驗參與者使用，支援建立合成聊天室與分享加入連結。

## Status

- accepted

## Context

- 使用者與測試朋友不在同一個工作環境，單機 localhost Worker 無法讓朋友加入。
- Project 定位為小規模技術實驗，不是商用服務；使用者預期兩至三位已知參與者測試。
- 原里程碑要求 M1 不公開部署未驗證匿名 Signaling；此決策依使用者最新需求調整該階段範圍。

## Options Considered

- 只在本機啟動前端及 Signaling Worker，使用兩個本機瀏覽器測試。
- 讓朋友各自連入不同本機 Worker，無法互通。
- 使用獨立 chatCore Staging 網站及 WebSocket Signaling，先不建立會員系統。

## Chosen Direction

- 使用 `chatcore-staging` Static Assets Worker 同時提供前端與專屬 Signaling Durable Object。
- M1 每個房間僅允許兩個 Peer；房間識別碼由瀏覽器產生，建立者可分享帶有房間代碼的 URL。
- 不建立帳號、會員 ACL、聊天歷史或資料持久化；測試內容只使用合成明文。
- 此 Staging 端點可由網際網路連線，房間代碼只是加入識別，不是身分驗證或安全控制。
- TURN 憑證未設定前，不能保證所有 NAT／網路組合都能連線；連線結果須回報 candidate pair 類型。

## Impact

- 需要在既有 Staging 發布白名單新增 `chatcore` 目標及獨立 Worker 設定。
- 不共用、不修改 `/ws/chat`、PublicChat Durable Object 或公開聊天室 v1 contract。
- Worker 端不保存訊息 payload；只有連線期間的 Signaling 與 Peer presence。

## Follow-up

- M1 Gate 記錄雙瀏覽器直連、TURN／relay 成功率及手動斷線恢復結果。
- 若後續改為真實私人訊息，先討論 E2E 加密、身分與房間授權，再開放真實內容。
