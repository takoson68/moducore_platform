---
status: completed-with-limits
phase: chatcore-experiment
authority: chatcore-experiment-result
updated: 2026-10-29
implemented: true
---

# M1b 結果：五人 Full Mesh Signaling 與雙模式實驗頁

## 狀態

**M1b 本機與 Staging Signaling Gate 通過；跨網路五人 WebRTC Full Mesh 仍待實際測試。** Staging 已部署最多五位參與者的房間限制、整合視圖／專注聊天切換、版號顯示及五人 Signaling smoke。Signaling smoke 不等於五個瀏覽器已建立完整 RTCDataChannel mesh。

## 範圍

- Project：`chatCore`
- Staging：[chatcore-staging.takoson68.workers.dev](https://chatcore-staging.takoson68.workers.dev/console)
- Tag：`dep_chatcore_v0.1.2`
- Commit：`5323f9a23da4c02a4ccc2fa6c1528db412fcbc10`
- GitHub Actions：[`Deploy tag dep_chatcore_v0.1.2`](https://github.com/takoson68/moducore_platform/actions/runs/40834185811) 通過。
- 房間上限：5 位參與者（含建立者），第 6 位拒絕。
- 測試資料：合成明文；無會員登入、聊天歷史、持久化或 E2E 加密。

## 已完成

- Private Chat Lab Worker 與房間限制由 2 人擴至 5 人；房間隔離維持獨立。
- 前端將文字廣播至所有已開啟的 Peer DataChannel，發送端只回顯一次，並呈現參與者、每個 Peer 的 ICE／路徑／RTT 與流量資料（只在瀏覽器有回報時顯示）。
- `/console` 提供整合視圖和專注聊天兩種模式，所有測試者均可切換；目前沒有登入或角色判斷，整合視圖不授予管理權限。
- 頁首版號使用部署 Workflow 注入的 `VITE_RELEASE_VERSION`，本版 Staging 顯示 `v0.1.2`。
- 整合房間建立／加入、邀請連結複製、離開與聊天操作；未加入檔案傳輸或歷史記錄。

## 驗證

- `VITE_PROJECT=chatCore VITE_RELEASE_VERSION=0.1.2 npm run build:cloudflare -- --outDir /tmp/chatcore-v0.1.2-check`：80 modules，成功；產物包含 `0.1.2`。
- 前端 `npm run test:api`：3/3 通過。
- 前端 `npm run test:chat`：8/8 通過。
- Worker `npm test`：77/77 通過，包含五人上限與第六人拒絕測試。
- `npm run check -- --config wrangler.chatcore-staging.jsonc`：dry-run 成功，確認 Private Chat Lab Durable Object 與 Static Assets binding。
- Staging Workflow：部署成功；SPA／深層路由 smoke 與 Private Chat Lab Signaling smoke 通過。遠端 smoke 五位 Peer 加入、offer relay 成功、第六位收到 `ROOM_FULL`。
- Staging 瀏覽器：頁首顯示 `v0.1.2`；整合視圖與專注聊天按鈕均可切換並顯示對應版面。
- 先前本機五瀏覽器實驗觀察到 5/5 參與者連線、每端四條 DataChannel，合成訊息由發送端送達其他四位；一位離開後其餘連線可繼續。此人工結果是在本次 UI 更新之前執行；本次 Staging Workflow 的 smoke 只驗 Signaling，沒有驗證遠端完整五人 RTCDataChannel。

## 尚待驗證

- 由多台實體裝置在本次 Staging 版本建立五人 RTCDataChannel Full Mesh，輪流傳送訊息並觀察單一 Peer 離線後其餘參與者互傳。
- 不同實體網路、TURN relay 成功率及流量／成本。
- CPU、記憶體與全房 PeerConnection 實際用量；目前未量測，不視為 M6 Gate 通過。
- WebSocket 背景休眠、恢復與重連策略。

## 限制

- 知道房間代碼者都可嘗試加入；沒有會員 ACL 或身分驗證。
- DataChannel 傳輸加密不代表 E2E 身分驗證；只使用合成文字。
- 尚無 IndexedDB、離線 queue、ACK、READ 或聊天歷史同步。
- 不宣稱適用正式或商用聊天室。

## 下一步

先由測試者在 Staging 以多個瀏覽器完成五人 DataChannel 操作與跨網路測試，記錄連線路徑、成功率及離線行為；檢討結果後再決定是否進入 M2 或安排 TURN／成本實驗。
