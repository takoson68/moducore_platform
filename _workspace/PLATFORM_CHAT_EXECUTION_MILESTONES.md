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

| 完成 | 編號 | 名稱 | 主要產出 |
|---|---|---|---|
| ✅ | M0 | 平台邊界與契約凍結 | Chat 介面、事件、命名空間與非目標確認 |
| 🟡 | M1 | WebSocket 後端 Proof of Concept | 候選後端單一公共房間、多端廣播 |
| ⬜ | M2 | Chat 前端 Runtime | `chat.js`、原始 Container、Store、Connection／Message Service |
| ⬜ | M3 | `magic-siege` 宿主整合 | 遊戲旁公共聊天室，Game／Chat 隔離 |
| ⬜ | M4 | 穩定性與效能驗證 | 斷線重連、批次更新、A～E 流量測試 |
| ⬜ | M5 | 第二個 Project 可移植驗證 | 非遊戲 Project 也能引用同一 Chat 能力 |
| ⬜ | M6 | 歷史訊息與平台化擴充評估 | SQLite 歷史、權限、節流與正式化決策 |
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
- [ ] 連線關閉後不殘留可觀察的連線與計時器。
- [x] Worker dry-run 與本機單元／整合測試通過。
- [ ] Staging smoke test 通過。
- [x] 暫定採用 Cloudflare Durable Objects 作為下一階段候選；Node.js 長駐 WebSocket 未採用，因目前平台沒有 Node Server 部署目標。
- [x] 第一階段不依賴聊天歷史資料庫；持久化延後至 M6。

### 結果

- 🟡 本機 M1 Proof of Concept 通過（2026-10-27）：`chat-poc.test.mjs` 4/4 通過。
- 本機驗證包含連線、廣播、ack、非法事件錯誤、房間隔離與 `projectId` 隔離。
- `wrangler.chat-poc.jsonc` dry-run 通過，確認 `PublicChat` Durable Object binding 可被打包。
- Node.js 原生 WebSocket 只完成架構比較，沒有實作第二套伺服器；目前不具備現成長駐 Node 部署目標。
- 尚未進行遠端部署，因此尚未宣告 M1 完成。

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

- [ ] Chat 可獨立 start／stop／dispose。
- [ ] Chat 不會註冊高頻狀態至平台 Singleton Store。
- [ ] 斷線時 Game 不會被 pause 或 reset。
- [ ] 重連後不會重複顯示同一 `messageId`。
- [ ] 頁面卸載後 WebSocket、timer 與 listener 全部釋放。
- [ ] 本地 mock 測試不需要 Cloudflare 網路連線。

## 6. M3：`magic-siege` 宿主整合

### 目標

只讓 `magic-siege` 引用平台 Chat，不把 Chat 實作搬入遊戲 Project。

### 產出

- 遊戲頁面旁的公共聊天室 UI。
- Project 設定中的 Chat opt-in／房間配置。
- Chat 與 Game 的並行掛載。
- 手機版基本排版與可收合面板。

### Gate

- [ ] 遊戲可正常開始、暫停、重開與完成一局。
- [ ] 遊戲 reset 不清除 Chat 訊息或連線。
- [ ] Chat 斷線不影響塔防 Simulation。
- [ ] Chat UI 不阻擋地圖、開始波次與遊戲控制。
- [ ] 移除 Chat opt-in 後，遊戲仍可獨立建置與運行。

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
- [ ] 所有測試結果記錄實際裝置、瀏覽器與版本。
- [ ] 純 Container 測試與完整 Game／Chat 測試結果分開記錄。

## 8. M5：第二個 Project 可移植驗證

### 目標

證明 Chat 是平台能力，而不是 `magic-siege` 專用功能。

### 產出

- 第二個 Project 掛載同一 Chat Runtime。
- 不複製 Chat Container、Store、Service 或 WebSocket contract。
- Project 只提供自己的 room namespace 與 UI 配置。

### Gate

- [ ] 第二個 Project 可獨立啟用 Chat。
- [ ] 兩個 Project 的房間資料互相隔離。
- [ ] Chat 核心測試不依賴任一 Project。
- [ ] `magic-siege` 的遊戲程式不需要因第二個宿主而修改。

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

- 目前狀態：M0 已完成，M1 本機 Proof of Concept 已完成；獨立 Staging smoke 已通過，但部署紀錄 target 格式仍待修正後重跑，完成後才進入 M2。
- 已建立 Chat contract、隔離的 Worker WebSocket route 與 `PublicChat` Durable Object PoC；尚未建立 ChatContainer 或 Chat UI。
- 尚未安裝新套件。
- 下一步：取得部署授權後，將隔離 PoC 部署至 Staging 完成 smoke test；未通過前不進入 M2。
