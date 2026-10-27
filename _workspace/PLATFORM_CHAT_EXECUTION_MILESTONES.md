# ModuCore Platform Chat 執行里程碑

> 狀態：planned
> 建立日期：2026-10-27
> 目標：建立可被所有 Project 選擇引用的公共 Chat 平台能力
> 第一個驗證宿主：`magic-siege`

## 0. 文件用途

本文件定義平台 Chat 能力的執行順序、範圍、完成 Gate 與停止條件。

- Chat 是 ModuCore Platform 能力，不是 `magic-siege` 的專案元件。
- `magic-siege` 只作為第一個整合與試玩宿主。
- `Chat` 是組合與生命週期協調者，底層必須重用原始 `Container` 實例。
- 每個里程碑必須通過 Gate，才進入下一階段。
- 本文件不授權直接修改 World、Container 核心或既有 Project 業務規則。

## 1. 架構邊界

```text
ModuCore Platform
├── World
├── Game Capability
└── Chat Capability
    ├── Chat 組合者（`chat.js`）
    ├── 原始 `Container` 實例
    ├── MessageStore
    ├── ConnectionService
    ├── MessageService
    ├── Chat Contract
    └── WebSocket / Durable Object Backend

Project
└── 選擇是否掛載 Chat，決定位置與視覺配置
```

### 必須遵守

- Chat 核心程式不得放在 `platform/frontend/projects/magic-siege`。
- 不得為 Chat 重新設計或複製另一套 Container 類別。
- `Chat` 可以擁有 `new Container({ services: {} })`，但 `Container` 仍是共用底層能力。
- Chat 不得依賴 Game Store、Simulation 或 p5 Engine。
- Game reset、pause、勝利與失敗不得自動重置 Chat。
- Chat 斷線、重連或錯誤不得阻塞 Game。
- 後端房間必須使用 `projectId + roomId` 隔離。
- 客戶端不得決定正式 `senderId`、`messageId`、server time 或 sequence。

### 第一階段不做

- 私訊、好友、圖片、檔案、表情商城。
- 完整社群權限、管理後台與內容審核平台。
- 永久聊天歷史與跨房間搜尋。
- 為聊天室重寫平台 Container 或 World lifecycle。
- 為 Chat 引入大型框架或新的前端狀態管理系統。

## 2. 里程碑總覽

狀態：`✅ 已完成`、`🟡 進行中`、`⬜ 未開始`、`⏸️ 延後`。

> **狀態校正（2026-10-27）**：本表格與原第 12 節「當前停止點」長期停留在「M1 PoC、尚未進入 M2」，但下方各里程碑自己的 Gate 勾選與「結果」段落（含日期與部署證據）早已記錄 M2～M5 的大量完成項目，且經原始碼（`platform/frontend/src/chat/*`、`platform/worker/src/chat-poc.js`、`platform/frontend/projects/{magic-siege,game-demo}/project.config.js`、`platform/frontend/projects/dineCore/modules/chat-admin/`）與本機 `git tag`／`git log`（`dep_platform-chat_v0.1.0`～`v0.1.10`、`dep_magic-siege_v0.1.51` 等、數十筆 `platform-chat` commit）交叉核對屬實。以下表格與第 12 節已依此校正為與既有 Gate／結果一致的狀態；未勾選的 Gate 項目維持未完成，不代表已補做。

| 完成 | 編號 | 名稱 | 主要產出 |
|---|---|---|---|
| ✅ | M0 | 平台邊界與契約凍結 | Chat 介面、事件、命名空間與非目標確認 |
| ✅ | M1 | WebSocket 後端 Proof of Concept | 候選後端單一公共房間、多端廣播；Gate 已全數通過（2026-10-27 補齊連線清理驗證與 Staging smoke 勾選，見第 4 節） |
| ✅ | M2 | Chat 前端 Runtime | `chat.js`、原始 Container、Store、Connection／Message Service；Gate 全數勾選 |
| ✅ | M3 | `magic-siege` 宿主整合 | 遊戲旁公共聊天室，Game／Chat 隔離；Gate 全數勾選 |
| 🟡 | M4 | 穩定性與效能驗證 | 斷線重連、批次更新、A～E 流量測試；M4-A/B/C 已有首輪結果，手機／iOS 長時間測試未完成 |
| 🟡 | M5 | 第二個 Project 可移植驗證 | 非遊戲 Project 也能引用同一 Chat 能力；`game-demo`、dineCore 管理頁已完成，跨房間重新整理隔離仍待人工確認 |
| ⬜ | M6 | 歷史訊息與平台化擴充評估 | SQLite 歷史、權限、節流與正式化決策；M1 Gate 已全數通過，規則上可開始，但尚未正式啟動，見 `_workspace/_reports/2026-10-27_platform_chat_scale_hardening/` 的準備工作 |
| ⬜ | M7 | 平台能力發布 Gate | 文件、測試、部署與回退證據完整 |

## 3. M0：平台邊界與契約凍結

### 目標

在寫程式前，確認 Chat 是平台能力，並凍結第一版可重用介面。

### 產出

- `Chat` 組合者與原始 `Container` 實例的責任分界。
- Chat lifecycle：`start`、`stop`、`dispose`。
- Store／Service 責任分界。
- `projectId + roomId` 房間命名規則。
- WebSocket 事件 envelope、錯誤碼與版本欄位。
- 匿名使用者與訊息長度／頻率限制原則。
- 平台層與 Project 宿主層的依賴方向。

### Gate

- [x] Chat 核心不依賴 `magic-siege`。
- [x] `Chat` 只組合原始 `Container`，不建立另一套容器實作。
- [x] 每個 Chat 實例的 Store／Service 都由自己的 Container 管理。
- [x] Chat 不把高頻狀態註冊到平台 Singleton Container。
- [x] Game 與 Chat 的生命週期互不控制。
- [x] 客戶端不可決定伺服器身分與時間欄位。
- [x] 第一版範圍與明確不做項目已確認。

### 結果

- ✅ M0 Gate 已完成（2026-10-27）。
- 新增平台共用契約：`platform/chat-contract/index.js`。
- 新增契約索引與 4 項執行期驗證測試；測試結果 `4/4` 通過。
- M1 的 WebSocket transport 與 Durable Object／其他候選方案仍未定案。

## 4. M1：WebSocket 後端 Proof of Concept

### 目標

先確認候選後端與目前部署條件相容，再證明公共聊天室的真實即時通訊可行，不先做完整 UI。

### 產出

- Worker `/ws/chat` WebSocket upgrade 路由。
- 候選方案的最小房間實作；是否採用 Durable Object 由本階段 Gate 決定。
- 單一房間廣播。
- `chat.ready`、`chat.message.send`、`chat.message.ack`、`chat.message.created`、`chat.error`。
- 伺服器產生 `messageId`、`senderId`、`serverTime`、`sequence`。
- 基本訊息大小與發送頻率限制。
- Cloudflare Workers、Durable Objects 與其他候選方案的成本／部署／維護比較。

### Gate

- [x] 本機兩個以上瀏覽器／WebSocket client 可同時連線。
- [x] A 發送訊息，B 可收到伺服器廣播。
- [x] 非法事件不會造成 Durable Object 崩潰。
- [x] 不同 `projectId` 的房間不互相收到訊息。
- [x] 連線關閉後不殘留可觀察的連線與計時器。
- [x] Worker dry-run 與本機單元／整合測試通過。
- [x] Staging smoke test 通過。
- [x] 暫定採用 Cloudflare Durable Objects 作為下一階段候選；Node.js 長駐 WebSocket 未採用，因目前平台沒有 Node Server 部署目標。
- [x] 第一階段不依賴聊天歷史資料庫；持久化延後至 M6。

### 結果

- ✅ M1 Gate 全數通過（原始 PoC 2026-10-27，殘留兩項於 2026-10-27 補齊）。
- 本機驗證包含連線、廣播、ack、非法事件錯誤、房間隔離與 `projectId` 隔離。
- `wrangler.chat-poc.jsonc` dry-run 通過，確認 `PublicChat` Durable Object binding 可被打包。
- Node.js 原生 WebSocket 只完成架構比較，沒有實作第二套伺服器；目前不具備現成長駐 Node 部署目標。
- **Staging smoke test**：依既有紀錄（Commit `346d843` 更新本文件與 `CURRENT_WORK.md`）補上勾選——`dep_platform-chat_v0.1.3`／Commit `0b2d391` 已部署至 `https://moducore-chat-poc-staging.takoson68.workers.dev`，兩個遠端 WebSocket 客戶端完成廣播 smoke，Release 與 verified deployment state 已建立。此為歷史已完成項目，本次只是把 Gate 勾選補齊，未重新部署或重跑遠端 smoke。
- **連線清理驗證**：新增 `PublicChat` 內部除錯路徑 `fetch` 分支（`X-Chat-Internal: 1` header + `/internal/connections`，僅能透過持有 `PUBLIC_CHAT` DO binding 的呼叫方存取，不經過公開 Worker 路由，不對外部網路暴露），並在 `chat-poc.test.mjs` 新增測試：兩個連線皆開啟時 `connections.size === 2`，依序關閉後分別降為 1、0，證明 `removeConnection`（含清除 `idleTimer`）確實執行、無殘留連線物件。測試：`node --test test/chat-poc.test.mjs` 7/7 通過；`npm test` 全量 73/73 通過。

M1 全數 Gate 通過，依文件規則可解鎖 M6；惟是否正式啟動 M6 由使用者決定。

## 5. M2：Chat 前端 Runtime

### 目標

建立平台共用的 Chat 前端能力，不綁定任何遊戲畫面。

### 產出

- 平台層 `chat.js` 組合者與其原始 `Container` 實例。
- `MessageStore`：連線狀態、訊息 ring buffer、錯誤與重連狀態。
- `ConnectionService`：連線、關閉、心跳與 exponential backoff reconnect。
- `MessageService`：事件封裝、驗證、ack、去重與排序。
- 可替換的 Chat UI host interface。
- WebSocket mock adapter，供離線測試使用。

### Gate

- [x] Chat 可獨立 start／stop／dispose。
- [x] Chat 不會註冊高頻狀態至平台 Singleton Store。
- [x] 斷線時 Game 不會被 pause 或 reset（Chat 未持有 Game 參考）。
- [x] 重連後不會重複顯示同一 `messageId`。
- [x] 頁面卸載後 WebSocket、timer 與 listener 全部釋放。
- [x] 本地 mock 測試不需要 Cloudflare 網路連線。

## 6. M3：`magic-siege` 宿主整合

### 目標

只讓 `magic-siege` 引用平台 Chat，不把 Chat 實作搬入遊戲 Project。

### 產出

- 遊戲頁面旁的公共聊天室 UI。
- Project 設定中的 Chat opt-in／房間配置。
- Chat 與 Game 的並行掛載。
- 手機版基本排版與可收合面板。

### Gate

- [x] 遊戲頁面以 opt-in 設定掛載 Chat，不修改 Game 內部 Store。
- [x] 遊戲 reset 不清除 Chat 訊息或連線（兩者由頁面同層獨立管理）。
- [x] Chat 斷線不影響塔防 Simulation。
- [x] Chat UI 預設收合，不阻擋地圖、開始波次與遊戲控制。
- [x] 移除 Chat opt-in 後，遊戲仍可獨立建置與運行（平台 Chat 為獨立 import）。

## 7. M4：穩定性與效能驗證

### M4-A：純 Container 基準測試

先隔離測量原始 Container 本身，再分析完整 Game／Chat 負載。

| 測試 | 目的 |
|---|---|
| 單一 Container | 建立初始化與銷毀基準 |
| 三個 Container | 比較多實例初始化與記憶體成本 |
| 三個 Container 各自更新 Store | 驗證狀態更新隔離與通知成本 |
| 重複建立與銷毀 | 驗證 instance、listener 與 service 資源釋放 |
| Game + Chat 完整運作 | 測量實際應用負載，與純容器結果對照 |

M4-A 不預設 Container 是效能瓶頸，必須以測量結果判斷。

### M4-A 純 Container 驗收狀態（2026-10-27）

- [x] 單一 Container 建立、resolve、destroy 基準已測量。
- [x] 三個 Container 建立、resolve、destroy 與 Store 更新隔離已測量。
- [x] 重複建立與銷毀 1,000 次已測量，未發現測試流程中的 listener 殘留。
- [ ] Game + Chat 完整負載尚未測量，留待 M4-B。

測試報告：[M4-A 純 Container 基準測試](./_reports/2026-10-27_platform_chat_m4a_container_benchmark/RESULT.md)。本次 Node 基準的三 Container 建立／銷毀中位數為 0.0194 ms；三 Container 各更新 1,000 次的中位數為 4.9485 ms。這些數字只代表目前 Node 測試環境，不取代瀏覽器與手機實測。

### 測試情境

| 情境 | Game | Chat 流量 |
|---|---|---|
| A | 正常運行 | 不載入 Chat |
| B | 正常運行 | 0 則／秒 |
| C | 正常運行 | 5 則／秒 |
| D | 正常運行 | 50 則／秒 |
| E | 正常運行 | 200 則／秒 |

### 測試分層

- 本地模擬：隔離 Store、佇列、批次更新與 DOM 成本。
- 真實 WebSocket：測量 handshake、序列化、驗證、廣播、延遲與重連。

### 必測指標

- FPS 與 p95 frame time。
- 收到訊息至畫面顯示延遲。
- Store 更新次數與 DOM render 次數。
- 主執行緒長任務、記憶體與 GC。
- reconnect 時間與重複訊息數量。
- 頁面離開後是否仍有連線、timer 或 listener。

### Gate

- [ ] 50 則／秒不造成明顯遊戲掉幀。
- [ ] 200 則／秒不造成無限佇列或記憶體增長。
- [ ] Game 與 Chat 的錯誤可分別觀察與處理。
- [ ] 手機背景切回後可恢復 Chat 連線。
- [x] 首輪測試結果已記錄實際瀏覽器與手機人工驗收狀態；低階手機長時間測試仍待補充。
- [ ] 純 Container 測試與完整 Game／Chat 測試結果分開記錄。

### M4-B 首輪執行結果（2026-10-27）

- [x] 本地模擬 0／5／50／200 則／秒，確認 Chat Store ring buffer 不會無限增長。
- [x] Staging 真實 WebSocket 兩連線、20 則訊息廣播與 ack 通過；p95 延遲 150.55 ms。
- [ ] 瀏覽器 DOM／p5.js FPS、手機背景切回與長時間記憶體測試尚未完成。

報告：[本地負載結果](./_reports/2026-10-27_platform_chat_m4b_load_benchmark/LOCAL_RESULT.md)、[真實 WebSocket 結果](./_reports/2026-10-27_platform_chat_m4b_load_benchmark/REMOTE_RESULT.md)。本輪證明 Chat 核心在本地與 Staging 基本資料流可運作，但不能把 Node 模擬 frame 時間當成實際遊戲 FPS。

### M4-C 首輪瀏覽器驗證結果（2026-10-27）

- [x] Staging 瀏覽器中聊天室收合／展開正常，收合不遮擋遊戲畫布。
- [x] 展開後可顯示伺服器分配的玩家編號與連線狀態。
- [x] 重新載入後可重新建立 Chat 連線並取得新的玩家編號。
- [ ] iOS Safari／加入主畫面背景切回、低階手機 FPS 與長時間記憶體尚未完成。

報告：[M4-C 瀏覽器並行驗證](./_reports/2026-10-27_platform_chat_m4c_browser_verification/RESULT.md)。

## 8. M5：第二個 Project 可移植驗證

### 目標

證明 Chat 是平台能力，而不是 `magic-siege` 專用功能。

### 首輪移植結果（2026-10-27）

- [x] `game-demo` 以設定 opt-in 掛載同一個平台 Chat Runtime。
- [x] `game-demo` Cloudflare build 通過，未複製 Chat 核心。
- [x] 第二個 Project Staging 網址已發布（`dep_game-demo_v0.1.5`、Workflow `40443472096`、HTTP 200）。
- [x] 發現並修正前端 WebSocket 未帶 roomId 的問題；`dep_game-demo_v0.1.6` 與 `dep_magic-siege_v0.1.47` 已成功發布。
- [ ] 使用者重新整理兩個網址後的公開跨房間訊息隔離仍待人工確認。

報告：[M5 game-demo 移植驗證](./_reports/2026-10-27_platform_chat_m5_game_demo_portability/RESULT.md)。

### 產出

- 第二個 Project 掛載同一 Chat Runtime。
- 不複製 Chat Container、Store、Service 或 WebSocket contract。
- Project 只提供自己的 room namespace 與 UI 配置。

### 平台聊天室管理（M5 延伸，未部署）

- [x] Chat Worker 以 `ChatDirectory` Durable Object 保存目前啟用中的聊天室目錄。
- [x] WebSocket 首次連線自動註冊新房間，管理頁不需要手動同步 Project 清單。
- [x] 管理 API 的建立、改名、停用只接受既有 `dineCore` 專案中資料庫驗證的 `super_admin` token。
- [x] `ChatRoomAdminPanel` 位於平台 `src/chat/`，dineCore 只提供路由與導航 adapter；未把 Chat 管理邏輯複製到遊戲 Project。
- [x] Chat Worker 測試 5/5、dineCore Cloudflare build 通過。
- [ ] 發布 Chat Worker 與 dineCore 管理入口，使用真實 super_admin 完成端對端驗收。

### Gate

- [x] 第二個 Project 可獨立啟用 Chat（game-demo build 與 host test 通過）。
- [ ] 兩個 Project 的房間資料互相隔離。
- [x] Chat 核心測試不依賴任一 Project。
- [x] `magic-siege` 的遊戲程式不需要因第二個宿主而修改。

## 9. M6：歷史訊息與平台化擴充評估

此階段只有在 M1～M5 穩定後才開始。

可能評估：

- Durable Object SQLite 最近訊息保存。
- 斷線補訊息與 sequence cursor。
- 登入身分整合。
- 禁言、封鎖與管理權限。
- D1 長期歷史與查詢。
- 房間列表與多頻道。
- Chat UI theme／slot contract。

這些功能不應提前加入第一版 MVP。

## 10. M7：平台能力發布 Gate

只有以下項目全部完成，才可把 Chat 宣告為可供其他 Project 使用的正式平台能力：

- [ ] 平台前端與 Worker 邊界文件完成。
- [ ] 前後端 contract tests 完成。
- [ ] Durable Object migration 與回退策略確認。
- [ ] Free plan 額度與超限行為已記錄。
- [ ] 安全限制、訊息上限與 rate limit 已驗證。
- [ ] 多 Project 隔離測試通過。
- [ ] 手機、桌面、重新整理、背景切換與斷線測試通過。
- [ ] Staging 部署與 smoke test 通過。
- [ ] 發布版本、回退方式與已知限制完成記錄。

## 11. 執行規則

每次執行只推進一個目前里程碑：

1. 先讀本文件對應章節。
2. 只做該里程碑的產出，不提前加入後續功能。
3. 執行對應測試與 Gate。
4. 記錄實際結果、未驗證風險與唯一下一步。
5. Gate 未通過時，不進入下一個里程碑。

若實作發現需要修改平台核心，必須先停在當前 Gate，說明：

- 為何既有 Container／World 無法支援。
- 最小核心修改範圍。
- 對現有 Project 的相容性影響。
- 是否可以用平台能力層繞開核心修改。

## 12. 當前停止點

> 本節於 2026-10-27 校正：舊版內容（「M0、M1 已完成，下一步進入 M2」）只反映 M1 PoC 剛完成時的狀態，未隨後續 M2～M5 的實際完成同步更新，與本文件 M2～M5 自己的 Gate／結果段落、`_workspace/CURRENT_WORK.md` 最上方條目不一致。現已依第 2 節總覽校正後的狀態、原始碼與 `git log`／`git tag` 證據重寫如下。

- 目前狀態：M0、M1、M2、M3 已完成；M4、M5 進行中（各自殘留項目見第 2 節總覽與對應章節）。
- `magic-siege`、`game-demo` 均已以設定 opt-in 掛載平台 Chat 並發布至 Staging（`dep_platform-chat_v0.1.0`～`v0.1.10`、`dep_magic-siege_v0.1.51` 等 Tag 存在於本機 `git tag`）；dineCore 已有 `ChatRoomAdminPage.vue`／`chat-admin` 模組作為聊天室管理入口。
- M1 已於 2026-10-27 補齊兩項殘留 Gate：「連線關閉後不殘留可觀察的連線與計時器」新增 `chat-poc.test.mjs` 專屬測試驗證；「Staging smoke test 通過」依既有歷史紀錄（Commit `346d843`、`dep_platform-chat_v0.1.3`）補上勾選，證據見第 4 節「結果」。
- M4 殘留：手機／iOS Safari 背景切回與低階手機長時間 FPS、記憶體測試未完成。
- M5 殘留：兩個 Project 網址重新整理後的跨房間訊息隔離尚待人工確認。
- M6 規則上已可開始（M1 Gate 全數通過），但尚未正式啟動；`_workspace/_reports/2026-10-27_platform_chat_scale_hardening/EXECUTION_PLAN.md` 已針對 M6 範圍（DO 內建 SQLite 歷史回放、前端訊息排序效能）做程式與本機測試層級準備，是否正式宣告 M6 開始由使用者決定。
- 下一步：使用者決定是否正式啟動 M6（持久化／擴充評估），或優先完成 M4／M5 的手機與跨房間隔離人工驗收。
