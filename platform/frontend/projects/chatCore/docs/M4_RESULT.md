# M4 結果：來源身分、ChatCore Session 與房間 Ticket

## 範圍

M4 將既有 dineCore 會員登入接到 chatCore 私人聊天室實驗，並將匿名 WebSocket 房間改為一次性 Ticket 入房。未修改 World、Container、共用登入 API、dineCore 程式或公開聊天室。

## 實作

- ChatCore 前端登入呼叫 chatCore 專屬 Worker API，仍使用平台既有 `authStore` 與 `tokenStore`；未建立前端第二套會員狀態。
- Worker 以 `X-Project: dineCore` 透過 `AUTH_SERVICE` 呼叫既有 dineCore `/api/login`。帳密不會傳給 chatCore 資料庫。
- Worker 驗證成功後立即呼叫 dineCore `/api/logout` 撤銷剛建立的上游 Bearer，再為 allowlist 內會員簽發 30 分鐘 HMAC ChatCore Session。前端不會取得 dineCore token；ChatCore Session 使用 `tenant_id: chatCore`，來源會員 ID 僅作身份映射。
- `/api/session` 會檢查簽章、期限及 ChatCore Auth Durable Object 中的有效記錄；登出會刪除該記錄。Durable Object alarm 清理過期記錄。
- `/api/private-chat/ticket` 綁定來源 tenant、會員及瀏覽器 deviceId，簽發 60 秒的一次性房間 Ticket。Ticket 留在 WebSocket URL，長效 Session 不放入 URL。重播、逾時 Ticket 會被拒絕。
- WebSocket Join 的 peerId 由 Worker 產生，瀏覽器不能冒用 peerId。Signaling 只在目前房間的已驗證連線間轉送；每一個 WebSocket 操作都檢查 ChatCore Session，登出／失效會拒絕後續操作並關閉 socket，房間 alarm 每 60 秒清理逾期或失效連線。
- 每房限制 20 個不同會員與 20 個已加入在線裝置；同一會員可用多裝置，但每台裝置有獨立 peerId。
- M4 使用 Worker `CHATCORE_MEMBER_USERNAMES` 以 dineCore 帳號名稱作為小型實驗 allowlist，名稱比對不區分大小寫。allowlist 內會員皆可加入彼此知道 roomId 的實驗房間；本階段尚無逐房加入／移除名冊或管理 UI，roomId 仍不是身份憑證。逐房 ACL 管理留給 M4a。

## 自動驗證

`platform/worker/test/private-chat-lab.test.mjs` 使用合成 dineCore Auth service，覆蓋：

1. `X-Project` 邊界、不支援路徑、匿名 WebSocket 拒絕及 dineCore Bearer 不能還原成 chatCore Session。
2. 非 allowlist 會員拒絕、ChatCore tenant 映射、Session 檢查與一次性 Ticket 重播拒絕。
3. 同房 Signaling 與未知／跨房目標拒絕。
4. 同帳號多裝置 peerId 獨立、第 21 個在線裝置拒絕，以及登出後拒絕既有 WebSocket 操作。

結果：`node --test test/private-chat-lab.test.mjs` 4/4 通過；完整 Worker suite 78/78 通過。

## 尚未驗證／Gate

- 已在 dineCore Staging 建立三個專用合成測試會員：`admin1`、`admin2`、`admin3`，皆為一般 `member` 角色；三者的登入及登出 API 均已驗證成功。這些帳號僅供 chatCore 實驗，不代表管理員權限。
- 已以本機 Miniflare、臨時本機 Session secret、`CHATCORE_MEMBER_USERNAMES=admin1,admin2,admin3`，經實際 Staging dineCore Auth Service 完成 ChatCore Worker 登入與登出整合驗證（HTTP 200）。臨時 secret 未寫入檔案。
- `wrangler.chatcore-staging.jsonc` 現在列出這三個合成帳號名稱；已為 Cloudflare Staging Worker 設定隨機 `CHATCORE_SESSION_SECRET`。`dep_chatcore_v0.1.5` 的部署步驟成功，Worker 與 Static Assets 已上線。
- 部署 Workflow 在匿名 WebSocket smoke 檢查收到預期 HTTP 400 後卡住；該 smoke 當時未消耗拒絕回應、未結束 socket。這是檢查腳本清理問題，不是 Worker 拒絕行為失敗。已補上 response body drain 與 socket terminate；修正後本機對 Staging endpoint 重跑 smoke，正常結束並通過。原 run `40847017330` 因 job 卡住而取消，故該 Tag 未形成成功 Release／Deployment 紀錄。
- 部署後手動端對端驗證已通過：Staging ChatCore API 登入／Session 還原／Ticket 簽發均 HTTP 200，Ticket WebSocket 成功加入房間，登出後 Session 失效。另在 Staging `/console` 實際操作頁面頂部會員登入表單成功顯示測試會員，隨後由 UI 登出。
- 尚未以 Staging 環境驗證部署後的 DineCore Auth Service binding，也未測量跨實體網路 TURN 成功率／relay 成本。
- Worker API 為 Vite 本機開發提供直接連至 `127.0.0.1:8787` 的跨來源請求；同源 Staging 不走此跨來源路徑。
- 本階段只用合成測試身份與明文，不代表已適合真實私人訊息。

M4 程式、自動測試、部署後 API／WebSocket 驗證及 UI 登入／登出均通過。部署 Workflow 的完整成功紀錄仍待修正 smoke 的新 Tag 流程完成；M4a 仍依每階段檢討原則等待本 Gate 的正式 Release／Deployment 證據。
