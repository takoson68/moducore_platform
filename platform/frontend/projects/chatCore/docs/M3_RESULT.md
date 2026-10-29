---
status: completed-with-limits
phase: chatcore-experiment
authority: chatcore-experiment-result
updated: 2026-10-29
implemented: true
---

# M3 結果：received／persisted／READ 語意

## 狀態

**M3 Gate 通過，等待使用者檢討後再決定是否進入 M4。** 協定與狀態仍只存在 Private Chat Lab；不改平台核心、Worker 或既有公開聊天室。

## 已完成

- DataChannel 改用 `chatCore.v1` JSON envelope，訊息帶穩定 `messageId`；outbox 重試沿用原 ID。
- 接收端解析訊息後先回 `received`；IndexedDB 新增或確認既有紀錄成功後才回 `persisted`。保存失敗只回 `received`，不回 `persisted`。
- 同一 `messageId` 以 IndexedDB 主鍵冪等保存；重複訊息不新增紀錄，仍可再次回 ACK。
- 發送端依每次嘗試送出的 Peer 分別保存 `received`、`persisted`、`read` 時間。所有本次目標 Peer 都 persisted 後，才刪除本機 outbox；這不是伺服器 queue。
- 10 秒未完成 persisted ACK 時將訊息標示逾時，保留 outbox，提供手動重試。重試會用同一 ID，重複 DataChannel 傳遞由收件端去重。
- READ 需同時符合 `document.visibilityState === 'visible'`、聊天室區域實際與視窗相交且可見、訊息 IntersectionObserver 可視比例至少 60%、訊息已在本機保存且尚未標讀。先保存本機 readAt，再傳 READ ACK。
- RTCDataChannel `bufferedAmount` 高於 256 KiB 時不再送出該 envelope，訊息保留在 outbox；本階段不做排程節流。
- 新增 READ 條件純函式與測試；沒有新增帳號、伺服器離線 queue、跨裝置歷史／已讀同步。

## 驗證

- chatCore Cloudflare build：成功（82 modules）。
- `npm run test:private-chat-lab`：3/3 通過，涵蓋 messageId 去重、逐 Peer ACK／outbox 刪除、ACK 冪等與未知 Peer 拒收、逾時狀態及 READ 條件。
- `npm run test:chat`：8/8 通過。
- 兩個隔離瀏覽器環境連上本機 Signaling Worker，DataChannel 為 host/direct；收到 received／persisted ACK 後，發送端顯示收件端保存。
- UI 連續傳送 10 則合成文字，兩端均收到 10 則。只在可視區的訊息送出 READ；將後續訊息捲入可視區後才補送 READ。整合版面中聊天室落在視窗外時未送 READ，切到可見專注聊天後才送 READ。
- 暫時注入接收端 IndexedDB unavailable：發送端只顯示 received 1/1、persisted 0/1，outbox 保留；收件端顯示未保存。10 秒後發送端標逾時。移除注入、收件端重連後，以相同 messageId 重試，訊息成功保存並回 persisted；收件端畫面只有一筆。注入碼已移除。
- `git diff --check` 通過。

## Gate 判定

| Gate | 判定 |
| --- | --- |
| 重複 `messageId` 只保存一次 | Repository 測試通過；重試路徑使用相同 ID |
| persisted 僅在 IDB 成功後發出 | 接收端 IDB unavailable 瀏覽器驗證通過；只收到 received |
| READ 的三項顯示條件 | 前景／聊天室可見／訊息可視條件有獨立單元測試；視窗外與捲入可視區有瀏覽器驗證 |
| DataChannel bufferedAmount 有保護 | 超過 256 KiB 拒絕新增傳送，保留 outbox；未進行高流量瀏覽器壓測 |

## 尚待驗證與限制

- 本次使用兩個瀏覽器環境，不是兩台實體裝置或跨網路驗證；M1b 跨網路與 TURN 成功率／成本仍待驗證。
- 未以瀏覽器故意丟棄一個 ACK 封包；ACK 重複冪等由 Repository 測試驗證，重試使用相同 messageId。
- 一個群組訊息只追蹤當次實際連線 Peer；未連線 Peer 不會收到，也沒有伺服器 queue。不同裝置仍各自持有本機歷史。
- READ 只保存於目前瀏覽器，沒有跨裝置一致性。若 READ ACK 傳送時連線中斷，本階段不提供後續補送保證。
- 測試仍只使用合成明文；DataChannel 的 DTLS/SCTP 傳輸保護不等同 E2E 身分加密。
- 舊版／非 `chatCore.v1` Peer 以 legacy 文字顯示，沒有 messageId 去重與 ACK 保證；需讓同房測試頁使用相容版本。
- 未部署、未 Commit／Push；未修改 Worker 或公開聊天室。

## 下一步

先檢討 M3 的逐 Peer ACK 與 READ 行為，再決定是否開始 M4 身分授權／房間 ACL。M4 前不接收真實私人訊息，也不將本機 ACK 狀態視為跨裝置或伺服器送達保證。
