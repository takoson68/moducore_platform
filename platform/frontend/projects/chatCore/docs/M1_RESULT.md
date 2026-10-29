# M1 結果：雙 Peer RTCDataChannel 與公開 Staging

## 狀態

**部分完成；等待外部網路與 TURN 驗證。** 已完成可分享房間連結的 chatCore Staging 網站、獨立 Signaling Worker，以及公開 Staging 上同機雙瀏覽器的雙向 P2P 文字驗證。尚未證明不同實體網路及 TURN relay 的連線成功率。

## 範圍

- Project：`chatCore`
- Staging Worker：`chatcore-staging`
- Staging 網址：[chatcore-staging.takoson68.workers.dev](https://chatcore-staging.takoson68.workers.dev/)
- 實驗頁：`/lab`
- Signaling 路徑：`/ws/private-chat-lab`
- 發布版本：`0.1.1`（Tag `dep_chatcore_v0.1.1`，Commit `a57f47c`）
- GitHub Actions：[`Deploy tag dep_chatcore_v0.1.1`](https://github.com/takoson68/moducore_platform/actions/runs/40832093099) 通過。
- 房間上限：2 個 Peer
- 測試資料：僅合成測試明文；本階段不接會員、不保存歷史、不提供 E2E 加密。

## 已完成

- 透過既有 Project 模組註冊方式新增 `/lab`，未修改平台 Container 核心。
- 獨立 Worker／Durable Object 提供 WebSocket Signaling 與每房兩 Peer 上限；未改動既有公開聊天室 Worker 或其契約。
- 頁面可建立隨機房間代碼、產生可分享網址、加入既有房間、雙向傳送文字，並顯示 ICE candidate pair 與 DataChannel 統計。
- 對端離開後另一端回到等待狀態；頁面卸載與手動中斷會釋放 RTC、DataChannel 及 WebSocket 資源。
- 同機兩個瀏覽器分別建立與加入公開 Staging 上的同一房間，合成文字雙向傳送成功；觀察到 `host/direct` candidate path。

## 驗證

- Worker 完整測試：`npm test`，77/77 通過（包含既有 Worker 測試與新 Signaling 測試）。
- chatCore 前端聊天室測試：`npm run test:chat`，8/8 通過。
- chatCore Cloudflare build：成功。
- Wrangler Staging 設定 dry-run：成功，包含 Worker、Durable Object 與靜態資產綁定。
- 本機 WebSocket smoke：兩 Peer 加入、第三 Peer 被拒絕、offer/candidate relay 通過。
- 遠端 GitHub Actions smoke：Staging 首頁、SPA fallback 與 Signaling 均通過；Signaling 驗證兩 Peer 加入、offer relay、第三 Peer 拒絕。
- 人工瀏覽器驗證：同機兩瀏覽器經公開 Staging 建立 RTCDataChannel、雙向傳送合成訊息通過；路徑為 `host/direct`。
- 對既有公開聊天室的 Worker 回歸測試包含於上述完整 Worker 測試；測試通過。

## 尚待驗證

- 朋友從不同實體裝置及不同網路加入此 Staging 網站。
- TURN 尚未設定；TURN-only、relay 成功率、流量與成本均待量測。嚴格 NAT、企業網路或防火牆環境可能無法直連。
- 網路切換、背景休眠／恢復後重新連線行為待跨裝置驗證。
- 0.1.0 首次發布後的第一個遠端 Signaling smoke 因 Worker 路由尚在傳播而收到 HTTP 404；稍後重試通過。0.1.1 將有界握手重試納入 smoke，該版遠端部署及 smoke 全部通過。

## 使用限制

- 房間代碼及連結僅供小型實驗分享，不構成身分驗證、會員 ACL 或保密邊界；知道房間代碼者可嘗試加入。
- 頁面不保存聊天紀錄，重新整理或離開後不提供歷史同步。
- 同帳號多裝置與跨裝置歷史同步尚未實作。
- 目前僅供少數已知測試者傳送合成文字；真實私人訊息上線前須另行討論 E2E 加密。
- 本里程碑只驗證雙 Peer；不代表已驗證 5～20 人 Full Mesh。

## 是否進入下一階段

**等待使用者檢討與決定。** 建議先讓朋友在不同網路實測並收集失敗情況，再決定是否設定 TURN、調整生命週期策略或進入 M2。遠端部署結果需以 GitHub Actions 與 Staging smoke 的實際證據更新，未完成前不得標為部署通過。
