---
status: active
updated: 2026-10-27
authority: execution-plan
scope: platform-chat-scale-hardening
---

# Platform Chat 效能／快取／DOM 承載 執行里程碑

## 0. 文件用途

本文件是 `platform/frontend/src/chat/`（前端 Chat Runtime）與 `platform/worker/src/chat-poc.js`（`PublicChat` Durable Object）針對「效能、資料變多後的暫存或快取、DOM 節點過多失控」三個問題的可恢復執行清單。新對話或上下文重置後，完成既有 VibeCore 導引，再由本文件「目前停止點」與第一個未完成項目繼續。

本文件不新增 World 或 Engineering 正式規則，只記錄本次工程範圍的里程碑、Gate 與證據。正式邊界仍以 `platform/frontend/src/chat/index.md`、`platform/chat-contract/index.md` 為準。

## 0.1 與既有 `_workspace/PLATFORM_CHAT_EXECUTION_MILESTONES.md` 的關係（必讀）

執行前發現該文件已存在，定義 Chat 平台能力的 M0～M7 正式順序，且：

- M6（歷史訊息與平台化擴充評估，含「Durable Object SQLite 最近訊息保存」）明文規定「只有在 M1～M5 穩定後才開始」。
- 該文件的 M1 Gate 仍有兩項未勾選（連線關閉後的殘留連線／計時器觀察、Staging smoke test）。
- 該文件第 2 節總覽表格與第 12 節「當前停止點」，與文件內 M2～M5 各節已勾選的 Gate 及部署紀錄（`dep_game-demo_v0.1.6` 等）不一致，屬於文件與現況落差，未在本次範圍內更正，僅在此記錄供後續核對。

本執行書是依使用者當前明確指令建立的獨立範圍（前端排序效能、DO 內建 SQLite 歷史回放、Hibernation 評估），**只做程式與本機測試層級的準備**，不進行 Staging 部署、不宣告 M6 已開始或完成、不自行修改 `PLATFORM_CHAT_EXECUTION_MILESTONES.md` 的里程碑狀態。本次 M2（持久化）與 M3（Hibernation）的產出，待使用者確認後應併入該文件的 M6／M1 收尾項目，而非視為獨立於平台正式里程碑之外的新分支。

## 1. 已確認的三個問題（來源：對話討論，2026-10-27）

1. **DOM 節點過多失控**：目前 `ChatPanel.vue` 直接 `v-for` 全部 `state.messages`，沒有虛擬捲動；靠 `MessageStore.addMessage` 的 `slice(-maxMessages)` 頂住上限，但不是真正的 windowing。
2. **資料變多後的暫存或快取缺失**：`PublicChat` 完全沒有持久化，`sequence`／`connections`／`processedRequests` 只活在 DO 記憶體；新加入或重連的使用者看不到任何歷史訊息，DO 被回收後 `sequence` 歸零。
3. **效能**：前端 `addMessage` 每筆新訊息都對整個陣列重新 `sort`；後端 `broadcast()` 是對 `connections` Map 同步 for-loop，且 `PublicChat` 走常駐 `server.accept()`，未用 WebSocket Hibernation API。

## 2. 範圍邊界

- 本次範圍：`platform/frontend/src/chat/`、`platform/worker/src/chat-poc.js`、`platform/worker/test/chat-poc.test.mjs`。
- 不涉及：D1 schema／Migration（改用 SQLite-backed Durable Object 自帶的 `storage.sql`，不新增跨 Project D1 綁定）、`chat-contract` 的客戶端事件驗證規則（`chat.history` 已存在於 `SERVER_EVENT_TYPES`，不需新增）。
- 本次不自動 Commit／Push／部署；程式變更完成並通過本機測試後，由使用者決定何時納入版本控制與部署。

## 3. 共通完成規則

每個里程碑完成時補上：完成日期、變更檔案、驗證指令與結果、剩餘風險。不得只勾選沒有證據。

## M1：前端訊息更新效能（對應問題 3）

目標：避免每筆訊息整包重新排序，新增批次寫入路徑供歷史回放使用。

- [x] `MessageStore.addMessage`：常見路徑（新訊息 `sequence` 大於目前最後一筆）改為直接 append + slice，不呼叫 `sort`；只有真的亂序才 fallback 走排序。
- [x] `MessageStore` 新增 `addMessages(batch)`：供歷史回放一次性合併去重並排序一次，而不是逐筆呼叫 `addMessage`。
- [x] `MessageService.receive`：新增處理 `chat.history` 事件，呼叫 `addMessages`。
- [x] `platform/frontend/scripts/test-chat-runtime.mjs` 新增 3 項測試並跑過。

完成日期：2026-10-27。變更檔案：[`messageStore.js`](../../../platform/frontend/src/chat/messageStore.js)、[`messageService.js`](../../../platform/frontend/src/chat/messageService.js)、[`scripts/test-chat-runtime.mjs`](../../../platform/frontend/scripts/test-chat-runtime.mjs)。驗證：`npm run test:chat`（`platform/frontend/`）8/8 通過（5 項既有 + 3 項新增：亂序排序、`addMessages` 批次去重、`chat.history` 合併）。剩餘風險：`MessageStore` 底層仍使用 `createStore` 的深度 `reactive()`，深層代理建立成本未消除（屬共用 `_storeFactory.js` 設計，非本模組可單獨變更，留待後續評估是否需要 `shallowReactive` 版本）。

Gate：新增或既有單元測試涵蓋「亂序到達仍排序正確」「大量連續訊息不逐筆排序」兩種情境 — 已達成。

## M2：後端訊息持久化與歷史回放（對應問題 2）

目標：讓 `PublicChat` 在自己的 SQLite-backed Durable Object storage 內保存最近 N 筆訊息與目前 `sequence`，新連線可收到 `chat.history`，DO 重啟不再讓 `sequence` 歸零或遺失全部歷史。

- [x] `PublicChat` 建構時以 `blockConcurrencyWhile` 建立 `chat_messages` 表，並從 storage 還原 `sequence`（`MAX(sequence)`）。
- [x] 新訊息寫入時同步 `INSERT` 並刪除超出 `CHAT_HISTORY_LIMIT`（50）的舊列，避免資料無限增長（呼應「暫存／快取」而非「無限保存」）。
- [x] `chat.ready` 之後，若有歷史紀錄則送出 `chat.history`（`SERVER_EVENT_TYPES` 已保留此事件，不需改 `chat-contract`）。
- [x] `platform/worker/test/chat-poc.test.mjs` 新增測試：之後加入的連線能收到先前訊息的 `chat.history`，且順序正確。

完成日期：2026-10-27。變更檔案：[`chat-poc.js`](../../../platform/worker/src/chat-poc.js)、[`chat-poc.test.mjs`](../../../platform/worker/test/chat-poc.test.mjs)。驗證：`platform/worker` 下 `node --test test/chat-poc.test.mjs` 6/6 通過（5 項既有 + 1 項新增歷史回放）；`npm test` 全量 72/72 通過，沒有連帶影響其他 Worker 測試。持久化改用 DO 自帶 SQLite storage（`state.storage.sql`），未新增 D1 binding 或 Migration，未修改 `wrangler.chat-poc.jsonc`。

剩餘風險：
- 尚未做跨 DO 重啟的持久化測試（Miniflare 測試在同一 DO 生命週期內驗證，未模擬真實 Cloudflare 回收／重新部署後 storage 是否保留，需 Staging 驗證）。
- 歷史回放未區分「使用者離線期間遺漏的訊息」與「完整最近 50 筆」，目前一律回放最近 50 筆，可能與使用者自己剛發送過的訊息重複（前端 `addMessages` 已用 `messageId` 去重，不會造成重複顯示，但流量上是多送的）。
- `persistMessage` 的 `INSERT`／`DELETE` 為同步 SQL 呼叫，尚未評估高頻率訊息下對單一 DO 執行緒的額外延遲，建議併入 M3 效能評估。

Gate：既有 5 項 `chat-poc.test.mjs` 測試全數通過，新增歷史回放測試通過 — 已達成。

## M3：WebSocket Hibernation 與廣播效能（對應問題 3 的後端部分）

目標：`PublicChat` 改用 Hibernatable WebSockets（`state.acceptWebSocket` + `webSocketMessage`/`webSocketClose`/`webSocketError`），連線中繼資料改用 `serializeAttachment`／`deserializeAttachment` 存活於 hibernation 之間，降低長連線但低頻率聊天室的常駐成本。

- [x] 評估現有 `wrangler.chat-poc.jsonc` compatibility_date 是否已支援 Hibernation API（需 `2022-11-30` 以後，目前 `2026-10-21` 足夠，且 `PublicChat` 已是 SQLite-backed DO，符合 Hibernation API 前提）。
- [x] 重寫連線 accept／訊息／關閉流程為 Hibernation API：`server.accept()` + `addEventListener` 改為 `state.acceptWebSocket(server)` + `webSocketMessage`／`webSocketClose`／`webSocketError`；連線中繼資料（`roomId`／`connectionId`／`playerId`／`playerNumber`／`displayName`／`lastActiveAt`）改用 `serializeAttachment`／`deserializeAttachment` 存活於 hibernation 之間；`this.connections` Map 移除，連線清單一律透過 `state.getWebSockets()` 取得。
- [x] 原本每連線一個 `setTimeout` 的 idle 斷線機制改為單一 DO `alarm()`（`storage.setAlarm`／`getAlarm`），因為一般 in-memory `setTimeout` 在 DO hibernate 後會遺失，`alarm` 則由 storage 持久排程、hibernate 後仍會喚醒 DO 執行。
- [x] `playerSequence` 改存入 `state.storage`（之前只存在記憶體），避免 DO hibernate／被回收後重新從 0 計數，與既有連線的 `playerNumber` 衝突。
- [x] 既有測試全數通過；新增兩項測試：連線清理驗證（沿用 M1 補 Gate 時寫的測試，改為走 `getWebSockets()`）、idle timeout 由 alarm 驅動關閉且不影響仍活躍的連線。

完成日期：2026-10-27。變更檔案：[`chat-poc.js`](../../../platform/worker/src/chat-poc.js)、[`chat-poc.test.mjs`](../../../platform/worker/test/chat-poc.test.mjs)。驗證：`platform/worker` 下 `node --test test/chat-poc.test.mjs` 8/8 通過；`npm test` 全量 74/74 通過，重跑 3 次確認無 flaky。

Gate 驗證細節：
- 新連線與訊息廣播：既有 7 項測試（連線、廣播、ack、房間隔離、projectId 隔離、歷史回放、連線清理）全數通過，證明改用 Hibernation API 後行為相容。
- Idle timeout：新增測試以 `CHAT_IDLE_TIMEOUT_MS` 環境變數（僅測試用，正式 `wrangler.chat-poc.jsonc` 未設定，沿用預設 10 分鐘）將逾時縮短為 2 秒，確認閒置連線會被 alarm 關閉、仍在送訊息的連線不受影響；改用輪詢 DO 內部連線數（透過 Miniflare `getBindings()` 直接呼叫 DO fetch，不經公開路由）驗證，而非依賴 ws client 端 `close` 事件時機（實測 client 端 close 事件到達時間明顯落後於 DO 內部狀態變化，直接讀取 DO 狀態更可靠）。
- 「DO 被模擬 hibernate 後再喚醒，既有連線 metadata 不遺失」：**未直接驗證**。Miniflare 5.x 未提供強制觸發 DO 記憶體回收／喚醒的測試 API，本輪只驗證了 `serializeAttachment`／`deserializeAttachment` 的讀寫邏輯正確、`alarm()` 能在 DO 常駐期間正確運作；attachment 能在真正 hibernation 後存活是 Cloudflare Hibernation API 自身的文件保證，未在本機環境獨立複測。

剩餘風險：
- `processedRequests`（請求去重 Map）仍只存在記憶體，DO hibernate／被回收後會清空；若使用者端因網路問題重送同一 `requestId`，恰好跨過一次 hibernate／喚醒，可能被當成新訊息重複送出（機率低，且前端 `MessageStore.addMessage` 以 `messageId` 去重，不會造成畫面重複顯示，但後端會多寫一筆歷史紀錄）。
- `sequence`、`playerSequence`、訊息歷史已持久化；`processedRequests` 若要同樣防護，需額外設計（例如在 SQLite 另建一張已處理 requestId 表並限制筆數），本輪未做，可留待 M6 評估。
- 尚未做真實 Cloudflare Staging 環境下的 Hibernation 行為驗證（連線數、成本、真實喚醒延遲），需日後部署後另行 Smoke 測試，不在本次本機範圍內。

Gate：既有測試不回歸 + 新增兩項 Gate 驗證通過 — 已達成（唯獨跨 hibernate 真實喚醒未能在本機獨立複測，已如實記錄）。

## 4. 目前停止點（本報告結案）

- M1、M2、M3 均已完成並通過本機測試（詳見各節證據）；使用者已確認本報告到此為止，暫不部署到 Staging 驗證。
- `PLATFORM_CHAT_EXECUTION_MILESTONES.md` 的總覽表格與第 12 節「當前停止點」已於 2026-10-27 校正並補齊 M1 殘留 Gate，目前狀態為 M0／M1／M2／M3 完成，M4／M5 進行中，M6／M7 未開始。本報告的 M2（持久化）、M3（Hibernation）是程式與本機測試層級準備，**不視為該文件 M6 已啟動或完成**，是否正式宣告 M6 開始仍由使用者另行決定。
- 未部署、未 Commit／Push；`wrangler.chat-poc.jsonc` 未修改。真正的 Staging 環境下的持久化行為與 Hibernation 行為（成本、真實喚醒延遲、跨 hibernate 的 attachment 存活）尚未驗證，記錄於第 3 節 M2／M3 的「剩餘風險」，留待之後部署時另行 Smoke 測試。
- 本報告狀態：收斂為「完成（本機範圍）」，暫無下一步待辦；後續若要部署、啟動 M6 或處理 `PLATFORM_CHAT_EXECUTION_MILESTONES.md` 的 M4／M5 殘留項目，由使用者另外提出。
