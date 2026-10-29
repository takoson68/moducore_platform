---
status: completed-with-limits
phase: chatcore-experiment
authority: chatcore-experiment-result
updated: 2026-10-29
implemented: true
---

# M2 結果：裝置本機 IndexedDB 歷史與 outbox

## 狀態

**M2 Gate 通過，等待使用者檢討後再決定是否進入 M3。** chatCore Private Chat Lab 現在會先將發送訊息與 outbox 原子寫入本機 IndexedDB，再交給 DataChannel；接收訊息也先寫入本機資料庫再顯示為已保存。此階段尚無 received／persisted ACK，不能判定收件端已持久化。

## 能力取捨

- 既有 `world.services.storage()` 會在 IndexedDB 失敗時靜默降級至 memory，且公開 API 沒有回報實際 driver 的方式；模組無法可靠區分持久化成功與記憶體暫存。
- 依里程碑規則，沒有修改平台 Storage capability；新增模組內薄型 repository：`modules/private-chat-lab/messageRepository.js`。
- Repository 使用獨立 IndexedDB database，包含 `messages` 與 `outbox` 兩個 object store；發送記錄與 outbox 在同一個 readwrite transaction 寫入。
- IndexedDB 不可用或 transaction 失敗時不切換 memory，不回報已保存；UI 顯示錯誤且發送端不送出未持久化的訊息。

## 已完成

- 房間加入後讀取該房間的本機歷史與 outbox；頁面重載也會依網址房間代碼還原。
- 發送訊息先原子寫入 history 與 outbox，再呼叫 RTCDataChannel。
- 接收訊息寫入 IndexedDB 成功後才標示「已保存在此裝置」；失敗時顯示未保存狀態。
- DataChannel 接受訊息後仍保留 outbox，顯示「尚無收件端保存確認」，並提供手動重試。
- outbox 未確認時重試可能使收件端看到重複訊息；M3 尚需加入 messageId 去重及 received／persisted ACK。
- 房間歷史與 outbox 僅屬目前瀏覽器的本機資料，不跨裝置同步；同一瀏覽器 profile 的同源分頁共用 IndexedDB。

## 驗證

- chatCore Cloudflare build：成功（81 modules）。
- 前端 `npm run test:chat`：8/8 通過。
- 瀏覽器本機 Worker + 兩個獨立瀏覽器環境：建立房間、RTCDataChannel 雙向連線、送出並接收合成文字成功。
- 重新載入後，發送端 history 與未確認 outbox 還原；接收端只還原自己曾保存的訊息。另一瀏覽器環境沒有取得加入前的本機歷史。
- 重新連線後，發送端可手動重試未確認 outbox；此時沒有 messageId 去重，實測限制已在 UI 標示可能重複。
- 以 IndexedDB unavailable 的測試注入驗證：頁面顯示 storage error；發送時明示本機保存失敗且不送出訊息。
- Worker `npm test`：77/77 通過，包含既有公開聊天室契約；本階段未修改 Worker。
- `git diff --check`：通過。

## Gate 判定

| Gate | 判定 |
| --- | --- |
| reload 後 history／outbox 可重現 | 通過 |
| IDB 失敗不回報持久化，且 UI 明示 | 通過 |
| 跨瀏覽器資料不自動同步限制已記錄 | 通過 |
| 公開聊天室回歸 | Worker 77/77 與前端 Chat runtime 8/8 通過；未執行遠端公開聊天室 smoke |

## 尚待驗證與限制

- 還沒有跨實體裝置／不同實體網路測試；本次分開瀏覽器環境驗證僅能證明儲存區隔，不等於跨裝置網路測試。
- M2 尚無收件端持久化 ACK；DataChannel send 成功不是送達或持久化證明。
- 未確認 outbox 手動重試在 M3 messageId 去重完成前可能造成重複訊息。
- IndexedDB 尚未按會員／deviceId 分區；目前 chatCore 尚無登入，資料只以 roomId 分類。
- 未做跨裝置歷史同步、伺服器 queue、備份上傳、READ 或 E2E 加密。
- M1b 的跨網路與 TURN relay 驗證仍待實驗，不因本次 M2 通過而視為完成。

## 下一步

先由使用者檢討 M2 結果與 outbox 重試限制，再決定是否進入 M3 received／persisted ACK、messageId 去重與 READ 條件實驗。M3 前不要把未確認訊息標成已送達或已持久化。
