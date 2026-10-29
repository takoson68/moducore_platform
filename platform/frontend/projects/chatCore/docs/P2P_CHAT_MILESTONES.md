---
status: planned
authority: chatcore-experiment-plan
updated: 2026-10-29
implemented: false
---

# chatCore P2P 私人／群組聊天室實驗里程碑

## 0. 文件定位

本文件規劃一系列可獨立操作、觀察與停止的技術實驗，用於研究：

- 既有 dineCore 會員身分如何安全進入私人聊天室。
- 最終如何將會員身分抽離為各 Project 可使用的共用身分來源，同時維持每個 Project 的獨立授權與資料隔離。
- WebSocket 如何負責房間、在線狀態與 WebRTC Signaling。
- WebRTC RTCDataChannel 如何承載純文字、ACK 與 READ。
- IndexedDB 如何保存每台裝置自己的本地歷史與 outbox。
- chatCore 如何提供獨立進入頁面與控制台，集中呈現聊天室入口及日後明確登錄的其他 Project 連結。
- Cloudflare 如何暫存最長 7 天的離線待送訊息。
- PWA 背景休眠、TURN relay 與 Full Mesh 規模的實際行為與成本。

chatCore 是獨立 Project。本文件是學習與驗證導向的實驗計畫，不是商用產品 Roadmap。每完成一個里程碑，都必須先展示結果、記錄量測、檢討風險，再由使用者決定是否進入下一階段；不得因本文件列出後續階段就預設全部實作。

本文件不授權修改 `_VibeCore/world/`、平台 Container 核心、既有公開聊天室、Production 或會員資料。Staging 發布須由使用者明確提出；本計畫只使用合成測試資料。

---

## 1. 已確認決策

1. 單房最多 20 名會員，同時最多 20 個在線裝置；兩者都是實驗上限，不是穩定性承諾。
2. 允許同帳號多裝置加入，但不做跨裝置歷史同步。任一裝置成功持久化即視為該帳號已送達，其他裝置可能沒有該訊息；UI 與測試必須明示此限制。
3. ACK 分為 `received` 與 `persisted`；伺服器離線 queue 只能依 `persisted` 刪除訊息。
4. READ 必須同時滿足：頁面在前景、聊天室可見、訊息進入可視區。
5. WebSocket 不要求永久常駐；預設在 PWA 前景活動期間維持，背景休眠後允許中斷，回到前景時重新驗證、重連並恢復必要狀態。不同生命週期策略必須實測。
6. 允許 TURN relay；各階段須量測直連／relay 比例、成功率、流量與可能成本。
7. 離線待送最長保留 7 天；到期刪除 payload，保留必要的未送達狀態。
8. 發送端保留 IndexedDB outbox，負責待送、queue admission 失敗與重試。
9. M9 前只做每 7 天備份提醒，不實作備份上傳。
10. 第一階段沿用既有 dineCore tenant 身分；chatCore 是獨立的前端 Project，不可因頁面獨立就將 dineCore token 當作 chatCore tenant token。M0 必須確認身分授權邊界，M4 才能實作驗證流程；不得破壞其他 Project 的會員與租戶邊界。
11. 第一階段只使用合成測試明文；真實私人訊息上線前必須另行討論應用層端對端加密。

後續方向：使用者希望會員資料最終獨立於 dineCore，供所有 Project 使用。因此 dineCore 身分只是過渡期實驗來源；chatCore 控制台的「新增會員」應落在共用身分能力完成之後，不能先把新增帳號永久綁在 dineCore。共用帳號不等於自動取得所有 Project 的權限，Project 仍須各自授權。

---

## 2. 明確非目標

- 不取代或改寫既有匿名聊天廣場。
- 不在 chatCore 建立第二套獨立帳號庫；長期會員建立應透過未來的共用身分服務。
- 不做圖片、影片、語音、附件或檔案傳輸。
- 不永久保存中央聊天歷史。
- 不同步所有使用者或同帳號所有裝置的完整歷史。
- 新成員不取得加入前歷史。
- 不預先建立 CRDT、Merkle tree、全域訊息排序或通用即時通訊框架。
- 不在本計畫中承諾背景常駐、推播必達、20 裝置穩定或商用 SLA。
- 不將聊天室需求寫入平台 Container 核心。
- 不讓 chatCore 控制台自行裁決其他 Project 的角色或業務權限；跨 Project 的共用身分與 Project 授權須分開驗證。

---

## 3. 現有基礎與隔離邊界

### 3.1 可重用能力

| 能力 | 現有位置 | 使用邊界 |
| --- | --- | --- |
| 登入、Session、固定會員身分 | `platform/worker/src/auth.js`、`migrations/0002_auth.sql` | 身分鍵使用 `(tenantId, userId)`；WebSocket 另加 `deviceId` |
| 前端 Auth／Token | `platform/frontend/src/app/api/index.js`、`src/app/stores/` | 不建立第二份 project-local 登入真相 |
| Hibernatable WebSocket、DO alarm | `platform/worker/src/chat-poc.js` | 只參考模式；私人聊天室使用獨立 route／class／contract |
| Chat 私有 Container 與連線清理 | `platform/frontend/src/chat/` | 可重用組合概念，不改變公開 Chat 行為 |
| IndexedDB capability | `src/app/container/services/storageService.js` | M2 可驗證；不得把 memory fallback 當成功持久化 |
| Project Module 註冊 | `projects/moduleRuntime.js` | 新模組只註冊 store、route、UI；P2P service 由模組私有 runtime 持有 |

目前 `platform/worker/src/auth.js` 以 `PROJECT_ID`、`X-Project` 與 `(tenant_id, user_id)` 驗證 Session；`migrations/0003_scrypt_credentials.sql` 的帳號／Token 表也按 tenant 儲存，dineCore 與 project-b Staging 各有獨立 D1。`platform/worker/src/index.js` 沒有一般會員建立 API；`/api/employees/create` 在 `src/employees.js` 只建立 project-b 員工資料，不是會員帳號 API。這些現況不能視為「全 Project 共用會員」已存在。

正式治理的 `_VibeCore/world/01_WORLD_MODEL.md`、`02_WORLD_BOUNDARIES.md` 要求 Project／tenant 隔離；`_VibeCore/world/model/IDENTITY_DB_USERS.md` 也將舊 users 模型定位為 tenant 內最小登入資料，而非完整會員系統。該歷史模型文件寫明「無 role」，但目前 Worker 的 `users` 表與 Auth 回應已有 `role`；兩者屬文件預期與實作現況差異，M10 必須重新核對，不得默默以任一方覆蓋另一方。共用身分必須先釐清其屬於平台身分服務、如何向單一 Project 發出受限授權，以及是否需依 World Change Protocol 提出正式變更；本計畫不得自行改寫 World 規則。

### 3.2 公開聊天室不可受影響

以下既有表面必須保持相容：

- `/ws/chat` 匿名聊天室入口。
- `PublicChat` 與 `ChatDirectory` Durable Object。
- `chat.ready`、`chat.message.send`、`chat.message.ack`、`chat.message.created`、`chat.history`、`chat.ping/pong`。
- 最近 50 則公開歷史、房間隔離、Project 隔離與 idle alarm。
- `ChatPanel.vue`、game-demo、magic-siege 與 dineCore `chat-admin`。
- `platform/chat-contract/index.js` v1 契約。

私人聊天應使用獨立命名，例如：

```text
/ws/private-chat
PrivateChatRoom
private-chat contract
chatCore/modules/private-chat（規劃名稱，尚未建立）
```

不得將 P2P 事件直接加入公開聊天室 v1 契約後宣稱相容。

---

## 4. 目標架構

```text
既有 dineCore Auth Worker + D1（第一階段身分來源）
  └─ 既有會員／Session
        │
        └─ 經明確授權邊界簽發的短效、一次性 WebSocket ticket
                    │
                    ▼
Private Chat Worker
  └─ PrivateChatRoom Durable Object（每房一個）
        ├─ 房間 ACL 與 20 會員／20 在線裝置限制
        ├─ 前景 WebSocket Presence
        ├─ SDP／ICE Signaling 與 ICE restart 協調
        ├─ 最長 7 天、逐收件者的離線待送 queue
        └─ persisted ACK 後冪等刪除
                    │
          ┌─────────┴─────────┐
          ▼                   ▼
Browser device A       Browser device B
  ├─ WebSocket 控制      ├─ WebSocket 控制
  ├─ RTCPeerConnection ◀▶├─ RTCPeerConnection
  ├─ RTCDataChannel       ├─ RTCDataChannel
  ├─ IndexedDB history    ├─ IndexedDB history
  └─ IndexedDB outbox     └─ IndexedDB outbox
```

### 4.1 前後端責任

伺服器負責：

- 驗證 Session／短效 ticket、tenant、membership 與 target device。
- 維護前景在線裝置與房間容量。
- 轉送 offer、answer、ICE candidate 與必要的 ICE restart 控制事件。
- 產生或轉交短效 TURN credential。
- 對 P2P 未確認送達的收件者保存最長 7 天 queue。
- 依 `persisted` ACK 冪等刪除指定收件者的 pending delivery。
- 執行 payload、rate、TTL 與 queue 容量限制。

前端模組負責：

- `RTCPeerConnection`、`RTCDataChannel` 與 Signaling WebSocket 生命週期。
- messageId、逐收件者狀態、去重、重試與 UI 投影。
- IndexedDB history／outbox 與持久化失敗提示。
- 頁面前景／背景、聊天室可見性、可視區 READ 判斷。
- 關閉 channel、peer、socket、timer、observer 與 event listener。

### 4.2 chatCore 專屬頁面與 Project 連結

- `chatCore` 是獨立的 `VITE_PROJECT` 目標，預計由 Project 自身模組註冊進入頁面與控制台路由；不修改平台 Router／Container 核心。
- 進入頁面呈現實驗定位與進入控制台的動線；控制台呈現聊天室入口及「其他 Project」連結區。會員登入狀態與連線狀態須等 M4 及對應連線里程碑完成後，才顯示真實狀態；此前標示未開放。
- 第一版連結由 chatCore Project 本地明確設定標題、目的地與是否顯示；不掃描其他 Project、不建立跨 Project 資料庫或通用後台。新增連結可獨立檢討是否需要管理 UI。
- 連結只負責導覽。目標 Project 仍用自己的網址、Session、tenant 與權限驗證；chatCore 不傳遞 dineCore token、ticket 或聊天室狀態給目標 Project。
- `chatCore` 的 `tenant_id`、可使用的會員範圍與 dineCore 身分授權方式，先在 M0 裁定並以 M4 驗證；頁面名稱不能作為跨 tenant 授權依據。

### 4.3 身分遷移與控制台功能邊界

- 過渡期：M4 以既有 dineCore 帳號驗證；M4a 可以把**既有** dineCore 會員加入 chatCore 房間，但不透過 chatCore 新建 dineCore 帳號。
- 長期：M10 驗證獨立共用身分與舊帳號映射，M11 才讓 chatCore 控制台透過共用身分 API 新增會員。共用身分的穩定識別不得沿用單一 tenant 內的數字 `userId` 當全域 ID。
- chatCore 控制台規劃三類操作：會員管理、聊天室管理、一對一私人連線。會員管理與聊天房間管理使用不同權限；一般會員可發起自己的私人連線，管理員不得在未經雙方授權下代替兩名會員建立可讀取的私人對話。
- 其他 Project 要使用共用會員時，須自行建立 Project-scoped membership／角色與 Session 授權；連結卡片本身不授權登入或讀取資料。

---

## 5. 最小協定與狀態

### 5.1 身分

```text
memberKey = tenantId + userId
peerKey   = tenantId + userId + deviceId
```

- `deviceId` 由瀏覽器產生並保存於 Chat 專用 IndexedDB。
- 不接受客戶端自行宣告的 role、tenantId 或 userId；以已驗證 Session／ticket 為準。
- 同帳號多裝置是多個 peer，但 delivery scope 先採 user scope：任一裝置 persisted 即完成該帳號送達。

### 5.2 文字訊息

```json
{
  "version": 1,
  "type": "message",
  "messageId": "uuid",
  "roomId": "private-room-id",
  "sender": {
    "tenantId": "dineCore",
    "userId": 22,
    "deviceId": "uuid"
  },
  "clientCreatedAt": 0,
  "contentType": "text/plain",
  "content": "合成測試文字"
}
```

- `messageId` 是冪等鍵。
- `clientCreatedAt` 只供顯示，不是權威全域順序。
- 純文字必須以文字節點渲染，不使用 `v-html`。

### 5.3 ACK／READ

| 事件 | 語意 | 是否可刪除 server queue |
| --- | --- | --- |
| `message.received` | 接收端程式已解析並接受事件 | 否 |
| `message.persisted` | 接收端已成功寫入 IndexedDB | 是 |
| `message.read` | 前景、聊天室可見且訊息進入可視區 | 否；只更新閱讀狀態 |
| `queue.accepted` | Server 已接管指定收件者的重試 | 否；不等於送達 |

所有 ACK／READ 必須能安全重送並以 `messageId + recipientUserId` 冪等處理。

### 5.4 發送端 outbox

1. 先把訊息寫入 IndexedDB outbox。
2. DataChannel open 時嘗試 P2P。
3. 收到 `persisted` 後標記該收件者 delivered。
4. 在實驗定義的送達期限內未收到 `persisted`，向 server 申請逐收件者入列。
5. 收到 `queue.accepted` 後停止由本裝置重複入列，但保留狀態投影。
6. queue admission 失敗時保留 outbox，等待前景恢復或使用者重試。

Presence 不能直接當作 delivered 判斷。

---

## 6. 訊息生命週期表

| 情境 | 發送端 | Server queue | 接收端 | 結果 |
| --- | --- | --- | --- | --- |
| 在線 P2P 成功 | 本地入 outbox 後送出 | 不需要 | IDB 成功後 persisted ACK | delivered |
| 在線但 P2P 失敗 | 等待 ACK 逾時 | 逐收件者冪等入列 | 重連後領取 | queued → delivered |
| 收件者離線 | 保留本地狀態 | 保存最長 7 天 | 上線後領取 | queued |
| queue admission 失敗 | outbox 保留並提示 | 無可靠副本 | 無 | retryable |
| queue.accepted | 標記 server queued | 已持久化 | 尚未收到 | queued，不是 delivered |
| 接收端 IDB 失敗 | 不標記送達 | 不刪 payload | 不發 persisted ACK，顯示錯誤 | queued |
| persisted ACK 遺失 | 仍可能顯示 queued | 再次補送 | messageId 去重，再回 ACK | 最終 delivered |
| P2P 晚到且 queue 也補送 | 接受重複 ACK | 冪等刪除 | messageId 去重 | 單一訊息 |
| 7 天到期 | 顯示未送達／已過期 | 刪 payload，留必要狀態 | 未收到 | expired |
| 群組部分送達 | 各收件者狀態分開 | 只保留未 persisted 者 | 各自處理 | partially-delivered |
| 同帳號 A 裝置 persisted | 該帳號視為送達 | 刪除 user-scope queue | B 裝置不保證有訊息 | delivered-with-device-gap |
| 新成員加入 | 不建立舊訊息任務 | 不補歷史 | 只收加入後訊息 | 符合範圍 |

---

## 7. 共同量測與安全基線

### 7.1 每階段共同量測

- WebSocket 連線／重連次數與連線維持時間。
- offer、answer、ICE candidate、ICE restart 數量。
- P2P 建立時間、成功率與恢復時間。
- selected candidate type：host／srflx／relay。
- TURN 上下行 bytes 與 allocation 數。
- Client JS heap（可取得時）、CPU、peer 數與 DataChannel bufferedAmount。
- Durable Object event、alarm、rows read/write、duration 與錯誤。
- IndexedDB 寫入成功、失敗、容量錯誤與 memory fallback。

WebSocket message 不得在報告中直接寫成等量 HTTP API request；Cloudflare billing request、duration、storage 與 TURN 流量分開記錄。

### 7.2 共同安全基線

- 短效 ticket 不使用長效 Bearer token query。
- 驗證 Origin、tenant、room、membership、sender 與 target。
- Offer／answer／candidate／文字／控制事件都有大小與頻率上限。
- 房間超過 20 會員或 20 在線裝置時拒絕加入。
- Session 過期、membership 撤銷與 ticket replay 必須被拒絕。
- 第一階段僅用合成明文；未完成 E2E 決策前不得放入真實敏感資料。

---

# 8. 實驗里程碑

## M0 — 隔離邊界與量測基線

### 技術問題

如何建立不影響公開聊天室、其他 Project 或平台核心的實驗落點？

### 本階段不做

- 不建立 RTCDataChannel。
- 不部署。
- 不建立離線 queue。
- 不修改公開聊天室契約。

### 先備閱讀

- `platform/frontend/projects/index.md` 與 `_VibeCore/projects/index.md`
- `platform/frontend/projects/dineCore/project.config.js`（僅供確認既有身分來源）
- `platform/worker/src/auth.js`（確認 tenant 與 Session 驗證邊界）
- `platform/frontend/projects/moduleRuntime.js`
- `platform/frontend/src/chat/`
- `platform/chat-contract/`
- `platform/worker/src/chat-poc.js`
- `platform/worker/test/chat-poc.test.mjs`

### 預計落點

- 獨立 `chatCore` Project 頁面與其 `private-chat` Module（後續實作候選，非本文件已建立的功能）。
- 私人 Chat 前端私有 runtime。
- 獨立 private-chat contract。
- 獨立 Worker route、Durable Object class 與測試。

實際路徑必須在 M0 執行時依當時索引再次確認，不預建空殼。

### 最小步驟

1. 凍結公開聊天室不可變回歸面。
2. 確認 `chatCore` 的 Project 身分、頁面範圍與第一階段 dineCore Session 授權路徑；`tenant_id` 如何宣告須與現有 Auth 契約相容，不能僅憑名稱推定。
3. 定義私人聊天室 route／event namespace。
4. 定義量測欄位、合成測試身分與 log 去識別規則。
5. 確認新模組只使用既有 store／route／UI 註冊，不擴充 Container 核心。

### 手動驗證

1. 開啟 game-demo 或 magic-siege 公開聊天室。
2. 連線、發訊息、重整並確認最近歷史仍正常。
3. 開啟 dineCore，確認其既有導覽與會員流程不受影響；若已建立 chatCore 頁面，另驗證它由 `VITE_PROJECT=chatCore` 獨立載入。

### Gate

- 新舊 route、contract、DO class 與資料 namespace 無重疊。
- chatCore 頁面與 dineCore tenant 的關係有明確、可測試的授權方案，且其他 Project token 不能跨入。
- 公開聊天室現有測試全數通過。
- 沒有修改 Container 核心。

### 失敗／回滾

若必須修改公開聊天室既有事件才能前進，停止 M0，重新拆分邊界；不得以版本相容假設直接繼續。

### 完成後討論

- 是否接受實驗落點與命名。
- 是否進入 M0a 建立獨立頁面與控制台。

---

## M0a — chatCore 進入頁面與控制台

### 技術問題

chatCore 能否以獨立 Project 載入，讓使用者從專屬進入頁面抵達控制台，並從控制台找到聊天室及日後登錄的其他 Project，而不碰平台核心或其他 Project 的登入狀態？

### 本階段不做

- 不建立 WebRTC、WebSocket 或真實聊天室訊息功能。
- 不建立第二套登入或跨 Project 單一登入。
- 不建立連結管理後端；第一版使用 Project 本地設定。
- 不部署或修改其他 Project。

### 預計落點

- 依新 Project 規範建立 `platform/frontend/projects/chatCore/` 的最低工程骨架及 `project.config.js`。
- 由 chatCore 自身模組註冊進入頁面與控制台路由；暫定 `/` 與 `/console`，實作時依現有 Router 與部署環境再次核對。
- 在控制台保留會員、聊天室、一對一私人連線及其他 Project 連結區；尚未完成的功能必須顯示為未開放，不能導向不存在的功能。

### 最小步驟

1. 依 M0 決議宣告 Project 身分與最小模組清單，建立可獨立載入的頁面骨架。
2. 建立進入頁面、控制台及兩者之間的明確導覽。
3. 以 Project 本地設定提供一筆受控測試連結，顯示目的地與開啟方式；目的地須可驗證，不以任意使用者輸入 URL 直接渲染。
4. 將聊天室入口標成「實驗尚未開放」，待後續里程碑具備 Gate 後再啟用。

### 手動驗證

1. 以 `VITE_PROJECT=chatCore` 啟動與建置，直接開啟進入頁面及控制台深層路徑。
2. 從進入頁面進入控制台；從控制台開啟已登錄的 Project 連結，確認目標 Project 自行驗證身分。
3. 以未登入狀態檢查：頁面可依已定規則顯示，但不得展示會員資料、私人房間或可用的私訊入口。
4. 切換 dineCore、game-demo 等既有 Project，確認原有入口與導覽未變。

### Gate

- chatCore 可獨立載入與建置；兩頁及深層路徑可操作。
- 連結設定只影響 chatCore；目標 Project 自行執行授權檢查，沒有 token／ticket 跨站傳遞。
- 控制台將會員管理、聊天室管理與一對一私人連線列為明確入口或未開放項目，且未宣稱尚未實作的能力已可用。
- 平台核心、公開聊天室與其他 Project 的程式行為未受影響。

### 失敗／回滾

若必須修改平台核心或放寬其他 Project 的租戶驗證才能顯示頁面／連結，停止本階段，重新檢查 Project 邊界。

### 完成後討論

- 控制台資訊與連結方式是否足夠；是否需要日後獨立規劃連結管理 UI。
- 是否授權進入 M1。

---

## M1 — 兩個瀏覽器建立 RTCDataChannel

### 技術問題

兩個前景瀏覽器能否透過隔離的 WebSocket Signaling 建立可靠、有序的 DataChannel，雙向傳送合成純文字？

### 本階段不做

- 不保存歷史。
- 不做正式會員 ACL。
- 不做 ACK／READ。
- 不做離線 queue。
- 不連接會員或持久化服務。
- 房間僅限兩個 Peer；Signaling 使用 chatCore 專屬 Worker，不沿用公開聊天室 route／契約。
- 只傳輸合成測試明文，頁面須明確說明此階段沒有訊息加密。

### 先備條件

- M0 與 M0a Gate 通過。
- Staging 網站可由兩個不同裝置或網路開啟同一房間連結。
- 實驗參與者為少數已知測試者；依使用者本次決定，M1 不建立登入或會員 ACL。

### 最小步驟

1. 建立兩 peer 的 offer／answer 與 trickle ICE 轉送。
2. 以穩定 peerKey 排序決定 offerer，避免 glare。
3. 建立 reliable、ordered DataChannel。
4. 支援 peer leave、connection failed 與一次 ICE restart。
5. 建立單一 dispose，關閉 peer、channel、socket、timer 與 listener。

### 手動驗證

1. 開啟 chatCore Staging，瀏覽器 A 建立合成聊天室並分享連結，由瀏覽器 B 加入。
2. A、B 各送一則純文字。
3. DevTools 確認 candidate pair 類型與 DataChannel 狀態。
4. 關閉 B，再確認 A 已釋放 peer。
5. 切換其中一端網路，觀察 ICE restart 與恢復時間。
6. 在可控網路下分別驗證 STUN 直連與 TURN-only。

### Gate

- 2 Peer 雙向純文字成功。
- 直連／relay 可被量測，不以猜測判定。
- dispose 後無殘留 socket、peer 或 timer。
- 公開聊天室回歸通過。

### 失敗／回滾

若受控環境仍無法穩定建立 2 Peer，不進 M2；保留實驗紀錄並分析 signaling、ICE 或 TURN 問題。

### 成本觀察

- Signaling message 數。
- WebSocket 活動時間。
- TURN bytes 與成功率。

### 完成後討論

- WebSocket 前景維持策略是否足夠。
- 是否值得進入本地歷史實驗。

---

## M1b — 五人以下聊天室連線擴充（依使用者指示）

### 技術問題

目前不含會員、持久化及 ACK 的 Private Chat Lab，能否將同房 Full Mesh 的連線上限調整為最多 5 位參與者（含建立者），並讓每位參與者把合成文字送到其他在線 Peer？

本實驗是 M1 的窄幅延伸，不取代 M6。M6 仍需在歷史、送達狀態與會員授權等前置里程碑後，以 5 個獨立裝置完成正式成功率、成本與恢復 Gate。

### 本階段不做

- 不超過 5 位參與者；第 6 位須明確拒絕。
- 不新增登入、會員邀請／核准、歷史保存、outbox、ACK、離線 queue 或 READ。
- 不宣稱房間連結具有身分驗證或保密效果；知道連結者可加入。
- 不以同機多分頁結果代替跨裝置、跨網路及 TURN 驗證。

### 最小步驟

1. 將 Private Chat Lab 的房間上限調整為 5，並在頁面顯示參與者與每條 Peer 連線狀態。
2. 讓每個在線 Peer 對房內其他已開啟 DataChannel 廣播合成文字；單一 Peer 失敗時仍可傳給其餘已連線 Peer。
3. 逐步加入第 3、4、5 個 Peer，確認配對協商與資源釋放。
4. 拒絕第 6 個 Peer，並量測每端 4 條連線、全房最多 10 條 PeerConnection 的實際結果。

### Gate

- 5 位 Peer 可加入並完成全房 DataChannel 連線；每端輪流發送時，其餘 Peer 均收到且發送端只回顯一次。
- 第 6 位加入被拒絕，房間隔離及現有公開聊天室回歸通過。
- 一位 Peer 離開後，其他仍連線 Peer 可繼續互傳；釋放該 Peer 的連線與統計計時器。
- CPU／記憶體、連線建立時間、relay 比例尚未完整量測者標為待量測，不宣稱 M6 Gate 通過。

### 完成後討論

- 是否開始 M2 IndexedDB 個人歷史／outbox；M1 跨網路與 TURN Gate 仍需另行補測。

---

## M2 — IndexedDB 個人歷史與 outbox

### 技術問題

每台裝置能否可靠保存自己的發送／接收歷史與待送 outbox，並在重新整理後還原？

### 本階段不做

- 不做跨裝置同步。
- 不做全房歷史同步。
- 不做備份上傳。
- 不把 memory fallback 視為成功保存。

### 最小步驟

1. 定義最小 message、history、outbox 資料形狀。
2. 先驗證既有 `world.services.storage()` 是否能滿足小量實驗。
3. 若無法辨識真實 IDB 成功或查詢成本不可接受，才在模組內建立薄型 repository。
4. 寫入順序固定為：本地持久化成功後才送出。
5. 建立容量錯誤與儲存不可用 UI。

### 手動驗證

1. A、B 各傳數則訊息。
2. 重新整理兩端，確認只還原各自曾保存的紀錄。
3. 模擬 IndexedDB 失敗，確認 UI 明示未持久化。
4. 確認 B 的另一裝置不會自動取得 B 原裝置歷史。

### Gate

- reload 後歷史與 outbox 可重現。
- IDB 失敗不回報 persisted。
- 「同帳號其他裝置可能缺少訊息」限制已顯示或記錄。
- 公開聊天室回歸通過。

### 失敗／回滾

若既有 Storage fallback 無法安全區分持久化結果，停止沿用該 capability；回到模組內 repository 方案，不修改平台 Storage contract。

### 完成後討論

- KV 是否足夠進入 M3，或需要專用 object store。
- 本地資料量與淘汰策略是否需要提前限制。

---

## M3 — received／persisted／READ 語意

### 技術問題

如何區分「交給通道」、「程式收到」、「成功保存」與「使用者已讀」？

### 本階段不做

- 不建立 server queue。
- 不將部分群組送達顯示成全部送達。
- 不保證跨裝置 read state 一致。

### 最小步驟

1. 建立 messageId 冪等去重。
2. 實作 `received` 與 `persisted` 兩階段 ACK。
3. 建立逐收件者狀態投影。
4. 實作 timeout 與本地重試。
5. READ 同時檢查 `document.visibilityState`、聊天室展開／可見與 IntersectionObserver 可視區。

### 手動驗證

1. 正常送達並觀察 received → persisted。
2. 阻止接收端 IDB 寫入，確認只有 received、沒有 persisted。
3. 丟棄一次 ACK，確認重送不重複顯示。
4. 切到背景、收合聊天室、捲出可視區，確認皆不發 READ。
5. 三條件同時成立後才發 READ。

### Gate

- 重複訊息只保存一次。
- persisted 僅在 IDB 成功後發出。
- READ 三條件有獨立測試與組合測試。
- DataChannel bufferedAmount 有上限或節流保護。

### 失敗／回滾

若狀態無法從實際事件證明，不進 M4；不得以 `send()` 成功代替 delivered。

### 完成後討論

- UI 是否需要同時顯示 received 與 persisted。
- persisted timeout 多久才轉入 server queue 實驗。

---

## M4 — chatCore 頁面的 dineCore 身分授權、Ticket 與房間 ACL

### 技術問題

如何沿用 dineCore Session，使私人聊天室只接受合法會員、房間成員與目標裝置？

### 本階段不做

- 不建立新帳號系統。
- 不共用其他 Project 的使用者狀態。
- 不把長效 Bearer token 放進 WebSocket URL。
- 不做正式邀請產品流程；可使用受控 fixture membership。

### 最小步驟

1. 依 M0 確認的授權邊界，透過既有 dineCore Auth Service 驗證登入；只允許 Worker `CHATCORE_MEMBER_USERNAMES` 合成測試帳號名稱名單。上游 dineCore Bearer 由 Worker 立即撤銷，不回傳瀏覽器，也不當作 chatCore tenant token。
2. 由受信任的服務端建立 30 分鐘 chatCore scope Session 與 60 秒、房間限定的一次性 WebSocket Ticket；Session 記錄可登出撤銷，過期記錄由 Durable Object alarm 清理。
3. 將已驗證 `(tenantId, userId, deviceId)` 綁定 socket attachment。
4. M4 先以實驗 allowlist 作為 cohort membership，並實作每房 20 會員／20 在線裝置限制；逐房名冊與控制台管理留在 M4a。
5. Signaling 只能送給同房且仍在線的 target peer。
6. Session／membership 失效時拒絕後續操作或關閉連線。

### 手動驗證

1. 合法 dineCore 會員取得 ticket 並加入 fixture 房間。
2. 未登入、過期 token、ticket replay、非成員、跨房、跨 tenant 全部被拒絕。
3. 同帳號兩裝置同時加入，peerKey 不衝突。
4. 第 21 位會員或第 21 個在線裝置被拒絕。

### Gate

- Auth truth 仍來自既有 Session。
- 其他 Project 的帳號／token 不能進入 chatCore 私人房；chatCore 也不能藉此讀取 dineCore 業務資料。
- 長效 token 未寫入 URL、log 或 WebRTC payload。
- ACL 與容量限制具自動測試。

### 失敗／回滾

若必須建立第二份登入真相或跨 tenant 共用 store，停止並重設邊界。

### 完成後討論

- 是否進入 M4a 建立控制台的聊天室與成員管理。
- membership 保存於房間 DO 或日後建立 D1 directory。

---

## M4a — 控制台建立聊天室與加入既有會員

### 技術問題

chatCore 管理員能否在控制台建立、列出及停用私人聊天室，並從既有已驗證的 dineCore 會員中加入／移除房間成員？

### 本階段不做

- 不建立新的 dineCore 或全域會員帳號。
- 不讓前端直接讀寫 dineCore `users` 表。
- 不修改公開聊天室的房間目錄或契約。

### 最小步驟

1. 將控制台的「聊天室管理」入口接到獨立 private-chat 管理 API；管理權限由服務端核對，不信任前端角色欄位。
2. 建立房間、列出房間、停用房間，並使用穩定 roomId 防止重複建立。
3. 以受限的會員查詢／選取介面加入或移除既有 dineCore 會員；服務端再次驗證來源身分、room ACL 與 20 會員上限。
4. 房間停用、成員移除或 Session 失效時，拒絕新的 ticket 與 Signaling，清理既有連線。

### 手動驗證與 Gate

- 管理員可建立一房並加入兩位既有會員；兩人可進房，非成員被拒絕。
- 一般會員、跨 tenant token、第 21 位成員及重複請求均按契約拒絕或冪等處理。
- dineCore 原有登入、會員 Session 與業務頁面回歸通過；chatCore 的房間資料不寫入 dineCore 業務表。
- 控制台僅顯示管理員有權查看的最小會員資料。

### 完成後討論

- 房間建立與加入流程是否足夠；是否進入 M4b。

---

## M4b — 控制台發起一對一私人連線

### 技術問題

一般會員能否在控制台選擇可聯絡的既有會員，發出一對一邀請，經對方接受後進入私密房間並建立 M1 已驗證的 P2P DataChannel？

### 本階段不做

- 不讓管理員代替兩位會員接受邀請。
- 不讓未經驗證的 peer 交換 SDP／ICE 或讀取聊天紀錄。
- 不保證對方離線時即時建立 DataChannel；離線待送由 M5 驗證。

### 最小步驟

1. 定義邀請的發起、接受、拒絕、取消與逾期狀態，僅由服務端核對雙方身分。
2. 接受後建立或查找唯一的一對一私密房間，限制只有雙方會員可進入。
3. 控制台顯示邀請狀態與「進入私人聊天」入口；連線仍由 WebSocket Signaling 與 WebRTC DataChannel 執行。
4. 驗證重複邀請、多裝置登入、斷線重連、撤銷成員與房間停用時的行為。

### 手動驗證與 Gate

- 兩名合成測試會員完成邀請、接受、雙向文字傳送；拒絕與逾期不會建立可用房間。
- 第三人、跨 tenant 使用者及被撤銷會員無法取得 ticket、Signaling 或歷史。
- 一對一房間的訊息仍遵守 IndexedDB、ACK／READ 與後續 7 天 queue 規則。
- 公開聊天室與 dineCore 業務流程回歸通過。

### 完成後討論

- 邀請體驗與權限是否足夠；是否進入 M5。

---

## M5 — 7 天離線待送 Queue

### 技術問題

對方離線或 P2P 未確認 persisted 時，如何逐收件者暫存、補送並可靠刪除？

### 本階段不做

- 不永久保存歷史。
- 不補新成員加入前資料。
- 不建立跨房間全域 inbox 服務。
- 不存真實敏感訊息。

### 建議資料模型

```text
pending_deliveries
- room_id
- message_id
- recipient_user_id
- sender_user_id
- sender_device_id
- payload
- created_at
- expires_at
- attempt_count
- last_attempt_at
- state

unique(room_id, message_id, recipient_user_id)
```

Delivery 採 user scope：同帳號任一裝置 persisted 即刪除該帳號 queue；其他裝置不保證擁有訊息。

### 最小步驟

1. 優先在獨立 `PrivateChatRoom` SQLite DO 內建立逐收件者 queue。
2. P2P persisted timeout 後冪等入列。
3. 回傳 `queue.accepted`，但不標示 delivered。
4. 收件者重連後批次補送；單批設數量與 bytes 上限。
5. 收到 persisted ACK 後冪等刪除。
6. `expires_at` 到期刪 payload，保留最小 expired 狀態。
7. 清理採 opportunistic cleanup 與最早到期 alarm 比較，不建立每訊息 timer。

### 手動驗證

1. B 離線，A 發送；確認 server 入列與 A 顯示 queued。
2. B 上線、成功寫入 IDB、回 persisted；確認 queue 刪除。
3. 丟失 persisted ACK；確認重送但 B 不重複顯示。
4. B 的裝置 1 persisted，確認裝置 2 不會自動同步且 queue 已完成。
5. 模擬 7 天到期，確認 payload 刪除、A 顯示 expired。
6. 群組中一人在線、一人離線，確認逐收件者狀態獨立。
7. 模擬 queue admission 失敗，確認 A outbox 仍可重試。

### Gate

- queue 只依 persisted 刪除。
- 重複 admission／補送／ACK 均冪等。
- 7 天後 payload 不存在。
- 部分送達不會誤標全部送達。
- rows read/write、storage、alarm 與 message events 有量測。

### 失敗／回滾

若 room DO 無法滿足登入後補送或查詢模型，再比較 D1；不得未經量測直接加入新 queue 服務。

### 完成後討論

- Queue 容量上限與超限 UI。
- expired metadata 保留多久。
- 是否有必要建立跨房間 inbox projection。

---

## M6 — 5 裝置 Full Mesh 小群組

### 技術問題

5 個在線裝置、10 條 PeerConnection 的 Full Mesh 是否能在桌機與行動瀏覽器維持可理解的狀態？

### 本階段不做

- 不測 20 裝置。
- 不承諾背景常駐。
- 不做全域訊息順序。

### 最小步驟

1. 逐步擴展 2 → 3 → 5 裝置。
2. 建立 deterministic offerer 與 staggered negotiation，避免同時爆量協商。
3. 群組訊息逐 peer 傳送，逐會員記錄 ACK 狀態。
4. 某 peer 失敗時不影響其他 peer。
5. 記錄 P2P 與 queue fallback 的比例。

### 手動驗證

1. 五個獨立瀏覽器 context 加入同一房間。
2. 每端輪流發送，確認每收件者狀態。
3. 任意關閉一端、恢復一端、切換一端網路。
4. 驗證同帳號兩裝置的 user-scope delivery 限制。
5. 驗證第 6 裝置仍可加入，但不超過已定 20 上限；此項只確認規則，不作壓測結論。

### Gate

- 5 裝置成功率、建立時間、relay 比例、CPU、記憶體與恢復時間已記錄。
- 任一 peer 失敗不使全房失效。
- 公開聊天室回歸通過。

### 失敗／回滾

若 5 裝置已無法穩定維持，停止擴展；記錄平台、瀏覽器與網路證據，不進 M7／M8 規模實驗。

### 完成後討論

- Full Mesh 是否仍值得繼續。
- 哪些裝置／網路需強制 TURN 或降低房間上限。

---

## M7 — PWA 前景／背景生命週期

### 技術問題

PWA 進入背景、鎖屏或恢復前景後，WebSocket、PeerConnection、queue 與 IndexedDB 實際如何變化？

### 本階段不做

- 不保證背景 WebSocket 常駐。
- 不實作 Web Push。
- 不要求背景期間即時送達。

### 比較策略

| 策略 | 實驗目的 |
| --- | --- |
| 前景保持 WebSocket，背景不主動關閉 | 觀察 OS／瀏覽器實際中止時間與恢復事件 |
| 進背景主動關閉控制連線 | 比較資源與恢復可預期性 |
| 短背景保留、長背景關閉 | 評估是否值得增加 grace period |

### 手動驗證

1. iPhone／支援裝置加入主畫面。
2. 前景加入房間並完成 P2P。
3. 短暫切 App、鎖屏、長時間背景後恢復。
4. 記錄 WebSocket close、ICE state、重連、ticket 更新與 queue 補送。
5. 背景期間由另一端發送，前景恢復後確認補送。

### Gate

- 至少一台真機完成可重現紀錄。
- 恢復流程不依賴背景連線必然存在。
- 回前景會重新驗證 Session／ticket，並冪等恢復 peer 與 queue。

### 失敗／回滾

若平台無法穩定背景維持，接受「背景離線、前景重連」作為實驗結論，不以輪詢或常駐技巧強行繞過 OS。

### 完成後討論

- 選擇哪個前景／背景策略。
- Web Push 是否值得成為獨立後續實驗。

---

## M8 — 10／20 在線裝置與成本上限

### 技術問題

Full Mesh 在 10／20 在線裝置時的連線成功率、資源、TURN 與 Cloudflare 成本是否仍可接受？

### 本階段不做

- 不預設 20 裝置一定通過。
- 不因測試失敗立即建立 SFU 或新拓樸。
- 不使用 Production 作首次壓測。

### 理論連線量

| 裝置 | 全房 PeerConnection | 每裝置 peer | 每則群組訊息發送副本 |
| ---: | ---: | ---: | ---: |
| 2 | 1 | 1 | 1 |
| 5 | 10 | 4 | 4 |
| 10 | 45 | 9 | 9 |
| 20 | 190 | 19 | 19 |

### 最小步驟

1. 建立可重複的 10 裝置受控負載。
2. 10 裝置 Gate 通過後才測 20。
3. 分別量測全直連、混合 relay、受控 TURN-only。
4. 量測同時加入、分批加入、同時重連與單 peer 網路切換。
5. 估算 DO billed requests、duration、storage、TURN bytes 與 client 資源。

### Gate

- 10 與 20 的成功／失敗都有原始量測。
- 明確提出建議上限，而非只沿用需求數字。
- TURN 與 Cloudflare 成本區分實測、估算、未知。
- 若 20 不可接受，文件明確降低上限，不把失敗隱藏為後續優化。

### 失敗／回滾

在 Staging／隔離測試環境停止壓測並清理連線；不更動 Production。是否研究其他拓樸需另立新決策，不在本階段順手實作。

### 完成後討論

- 實驗房間上限是否維持 20。
- 是否繼續 Full Mesh、降低上限，或開始新的拓樸研究。

---

## M9 — 7 天備份提醒與匯出決策

### 技術問題

如何提醒使用者本地歷史可能遺失，並決定後續備份方式？

### 本階段不做

- 不實作雲端上傳。
- 不在背景排程七天定時器。
- 未確認格式、加密與衝突規則前不提供正式匯入。

### 最小步驟

1. 保存 `lastBackupReminderAt`／`lastExportAt`。
2. 使用者下次在前景開啟聊天室時檢查是否已滿 7 天。
3. 顯示可延後的提醒與本地資料風險說明。
4. 討論 JSON 匯出、加密、目的地與匯入衝突策略。

### 手動驗證

1. 模擬未滿 7 天與超過 7 天。
2. 背景／關閉期間不期待自動提醒。
3. 清除瀏覽器資料後，確認提醒狀態也可能遺失並有文件說明。

### Gate

- 提醒只在前景檢查。
- 未宣稱提醒等於備份。
- 是否加入本地匯出由使用者另行決定。

### 完成後討論

- 備份格式、是否加密、保存位置與匯入規則。
- 是否另開正式備份里程碑。

---

## M10 — 共用會員身分與 Project 授權邊界實驗

### 技術問題

如何讓 dineCore、chatCore 與日後其他 Project 使用同一個會員帳號，同時保留各 Project 的獨立 `tenant_id`、角色、資料與登入授權？

### 本階段不做

- 不直接把現有各 D1 的 `users` 表合併或改寫為共用表。
- 不讓共用身分自動取得所有 Project 的進入權。
- 不修改 `_VibeCore/world/` 正式文件；若設計需要變更 World 邊界，依 Change Protocol 提案後另行裁決。

### 最小步驟

1. 盤點現有 `(tenant_id, user_id)`、username、Token、角色、D1 與前端 `X-Project` 契約；標記同名帳號與 ID 碰撞、既有 Session 有效期及回退需求。
2. 提出獨立共用身分來源及不可變的全域會員 ID；另以 Project-scoped membership／角色表示可進入哪個 Project。定義舊 dineCore ID 到全域 ID 的映射，不假設數字 ID 跨資料庫唯一。
3. 判斷此平台級身分服務是否符合單一 World／Project 隔離；若需 World 語意變更，先完成正式治理裁決，再進行工程試驗。
4. 在隔離的合成測試環境驗證一個共用帳號可分別取得 dineCore 與 chatCore 的受限 Session；撤銷其中一個 Project 授權，不影響另一個 Project。
5. 設計分階段遷移與回退，不要求一次搬移真實會員或讓既有 dineCore 登入失效。

### Gate

- 共用身分、Project 授權與 Project 業務資料三者的權威來源各自明確。
- 跨 Project token、角色或資料不能互用；同名與同 ID 碰撞有可驗證映射。
- dineCore 原登入與業務流程回歸通過；任何正式資料遷移須另行授權與驗證。
- 若 World 治理未確認合法性，不進 M11。

### 完成後討論

- 是否採用共用身分方案與遷移順序；是否進入 M11。

---

## M11 — chatCore 控制台新增共用會員

### 技術問題

chatCore 管理員能否透過 M10 確立的共用身分 API 新增會員，並單獨授予 chatCore 的使用權，而不建立第二套帳號或自動開通 dineCore 及其他 Project？

### 本階段不做

- 不在 chatCore 本地保存密碼雜湊或會員主檔。
- 不由 chatCore 修改其他 Project 的角色或業務資料。
- 不以「控制台有連結」推論該會員已獲得目標 Project 權限。

### 最小步驟

1. 以共用身分服務的受限 API 建立會員；密碼／憑證只由該服務處理，控制台不記錄明文。
2. 將 chatCore Project membership 的新增、停用與角色授予和帳號建立分開操作；每項操作要求服務端管理權限與稽核紀錄。
3. 讓新會員以共用帳號登入 chatCore，再依房間 ACL 進入聊天室或接受私人連線邀請。
4. 驗證新增會員、重複帳號、停用、撤銷 chatCore 權限及不同 Project 授權的獨立性。

### Gate

- 新會員有穩定全域 ID，chatCore 會員權限可撤銷；沒有隱含 dineCore 或其他 Project 權限。
- 房間 ACL、離線 queue、IndexedDB 身分鍵與訊息去重在遷移後仍正確。
- dineCore 原會員登入與業務功能回歸通過；不存在第二份密碼真相。

### 完成後討論

- 其他 Project 是否要接入共用身分服務，須各自決定授權與回歸範圍。

---

## 9. 每階段完成模板

每個里程碑結束時必須留下：

```text
狀態：passed / failed / paused
測試環境：瀏覽器、裝置、網路、Cloudflare environment
實際完成：
明確未完成：
自動測試：
手動操作結果：
P2P 成功率：
host / srflx / relay 比例：
WebSocket / DO / TURN 用量：
Client CPU / memory / peer 數：
公開聊天室回歸：
已知風險：
是否進下一階段：等待使用者決定
```

任何未量測數值必須標成「待量測」，不得以推測數字替代。

---

## 10. 全計畫停止條件

出現以下任一情況，停止當前階段並回報：

- 需要修改 World、平台 Container 核心或公開聊天室契約才能前進。
- dineCore tenant 與其他 Project 身分發生混用。
- 共用身分方案讓某個 Project 的角色、Session 或業務資料自動進入另一個 Project。
- M1 以外的里程碑若把未驗證的會員／房間授權用於真實會員資料或 Production。
- IndexedDB 失敗卻無法讓 UI 辨識。
- Queue 無法證明 persisted ACK 後可靠刪除或 7 天後刪 payload。
- 真實敏感訊息將在 E2E 決策前進入實驗。
- Cloudflare、TURN 或裝置成本超出使用者另行確認的範圍。
- 某階段 Gate 未通過，卻要求直接進入後續規模實驗。

---

## 11. 下一步

M0、M0a、M1b、M2 與 M3 已完成；M1b 的跨實體網路及 TURN 成功率／成本仍待補測。M2 結果見 `M2_RESULT.md`，M3 結果見 `M3_RESULT.md`。M4 合成自動測試 Gate 通過，結果見 `M4_RESULT.md`；真實 dineCore Staging Auth Service、`CHATCORE_SESSION_SECRET` 與 `CHATCORE_MEMBER_USERNAMES` 尚待配置與人工驗證，故 M4 Staging Gate 未完成。目前停止於 M4 Gate，先檢討 Staging 設定與驗證方式，再決定是否進入 M4a；每階段完成後均不得自動推進。
