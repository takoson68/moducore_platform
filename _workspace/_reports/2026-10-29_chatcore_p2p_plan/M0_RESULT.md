---
status: passed
authority: experiment-evidence
updated: 2026-10-29
---

# chatCore P2P 實驗 M0：隔離邊界與量測基線

## 範圍與結果

依 `P2P_CHAT_MILESTONES.md` 執行 M0。已完成程式／設定盤點、私人聊天候選 namespace、身分轉接方案與本機回歸測試。首次 Staging 手動驗證發現公開聊天室沒有歷史回放；後續依使用者「下一步」指示，透過正式 Tag Workflow 發布已在本機驗證的 Chat Worker，重整及第二分頁歷史回放均通過。**M0 Gate 現已通過，M0a 尚未啟動。**本階段未建立 chatCore Project 或私人 Chat 程式、D1／Worker；僅更新既有公開 Chat Worker 的 Staging 版本。

## 1. 規則、現況與候選邊界

| 類型 | 證據與結論 |
| --- | --- |
| 規則 | `_VibeCore/world/01_WORLD_MODEL.md`、`02_WORLD_BOUNDARIES.md`：一個 Project 對應一個 `tenant_id`；Project 資料、設定與狀態隔離。`_VibeCore/engineering/IDENTITY_ACCESS_CONTRACT.md`：若沿用平台 Auth，前端登入真相是 `authStore`，登入／還原／登出經 `world.authApi()`。 |
| 實作 | `platform/frontend/vite.config.js` 以 `VITE_PROJECT` 選擇單一 Project；`src/world.js` 與 `src/app/api/index.js` 把 Project 名稱帶入 `X-Project`。`platform/worker/src/auth.js` 要求 `X-Project === env.PROJECT_ID`，並以 `(tenant_id, user_id)` 驗證 Session。 |
| 推論／候選 | chatCore 的 `project.config.js` 應宣告獨立 `name`／`tenant_id: chatCore`。第一階段 dineCore 只作為**外部身分來源**；未經轉接的 dineCore token 不能作為 chatCore Project Session。 |

### M4 待實作、可驗證的身分轉接方案

1. chatCore 的 `/api/login`、`/api/session`、`/api/logout` 對前端維持 `world.authApi()` 既有契約，要求 `X-Project: chatCore`；前端只有一份 `authStore`／`tokenStore`。
2. chatCore 後端透過受信任的服務端綁定向 dineCore Auth 驗證帳密或既有 Session，映射來源 `(dineCore, userId)` 與 chatCore 的 Project-scoped membership，簽發僅限 chatCore 的 Session／短效 WebSocket ticket。dineCore token 不直接放入 chatCore 的 World Auth 狀態或 WebSocket URL。
3. ticket 僅能進入 chatCore 私人房間，綁定 room、member、device、短時效與一次性使用。其他 Project 的 token、role、Store 與業務資料均不得被沿用。
4. 此方案目前是**設計候選，不是已實作能力**。M4 需用跨 tenant token、Session 失效、ticket replay 與 room ACL 測試證明；若無法維持 World／Auth 契約，須停止並重新裁定。

長期共用會員方向仍由 M10～M11 單獨驗證；M0 不把 dineCore 帳號表改成全域會員表。

## 2. 私人聊天 namespace 與責任落點

| 面向 | 現有公開聊天室 | 私人聊天候選 |
| --- | --- | --- |
| WebSocket | `platform/worker/src/chat-poc.js` 的 `/ws/chat` | 獨立 Worker 的 `/ws/private-chat` |
| 契約事件 | `platform/chat-contract/index.js` 的 `chat.*` v1 | 獨立 `private-chat` 契約與 `private.chat.*` 事件 |
| Durable Object | `PublicChat`、`ChatDirectory` | 獨立 `PrivateChatRoom` class 與 binding |
| 資料 namespace | `projectId:roomId:v2` | `chatCore:roomId:private-v1`；房間 ACL／queue 與公開資料分離 |
| 前端 | `platform/frontend/src/chat/` 共用公開 Chat Runtime | `platform/frontend/projects/chatCore/modules/private-chat/` 的私有 P2P runtime；透過既有 `projects/moduleRuntime.js` 註冊 store／route／UI |

上表是 M1 以後的候選落點，M0 未建立這些檔案或改動公開聊天室。

## 3. 量測與合成資料基線

- 後續每階段記錄：測試瀏覽器／網路、成功與失敗的 peer 數、ICE `host`／`srflx`／`relay` 比例、連線建立時間、WebSocket／DO／TURN 用量、裝置 CPU／記憶體、重連次數與失敗原因。M0 未建立 P2P，這些指標均為「不適用」，不能填入推測數值。
- 身分與訊息僅用合成測試資料；記錄以 traceId、roomId 的不可逆或受控識別為主，不記錄密碼、Bearer token、SDP、ICE candidate、完整訊息 payload、私人聊天歷史或可直接使用的 ticket。
- 單房 20 會員與 20 在線裝置是實驗上限，不是本階段實測容量。

## 4. 驗證

| 項目 | 結果 |
| --- | --- |
| 前端公開 Chat Runtime | `platform/frontend`: `npm run test:chat`，8/8 通過。 |
| 公開 Chat 契約 | `platform/chat-contract`: `node --test index.test.mjs`，4/4 通過。 |
| Worker 公開聊天室 | `platform/worker`: `node --test test/chat-poc.test.mjs`，8/8 通過，含連線、歷史、房間與 Project 隔離。 |
| Auth tenant 邊界 | `platform/worker`: `node --test test/auth.test.js`，13/13 通過，含跨 tenant token 拒絕。 |
| Staging game-demo 公開 Chat | 2026-10-29 於 `game-demo-staging.takoson68.workers.dev` 開啟聊天室，顯示「已連線」；送出「M0 合成測試訊息」後當頁可見。重整並再次展開時顯示「尚無訊息」；另開同站第二分頁、連線後仍顯示「尚無訊息」。與本機歷史回放測試不同。 |
| Staging Chat Worker 版本 | 唯讀 `wrangler deployments list` 顯示最新部署使用版本 `dbc6d146-a91e-479f-90fe-d18761bab9b5`，建立於 2026-10-27 05:40:39 UTC（台北 13:40）；`wrangler versions view` 顯示此版本 active 100%。本機 `git blame` 證明 `PublicChat` SQLite 歷史保存與回放來自 commit `e08527f`（同日台北 15:57），晚於上述部署。這可解釋線上與本機差異，但未直接取得線上 script 原文，故不能宣稱唯一原因已獲證實。 |
| Staging dineCore 入口 | 同日開啟 `dinecore-staging.takoson68.workers.dev/`，桌邊點餐 A01 入口可見；未登入、未修改資料，不能據此宣稱完整會員／業務回歸已驗收。 |

本次沒有建立 chatCore 頁面，因此 `VITE_PROJECT=chatCore` 載入與建置屬 M0a，未執行。首次 M0 盤點時未修改產品程式碼、未安裝套件或部署；後續僅按第 6 節發布既有 Chat Worker 的 Staging 版本。`platform/frontend/vite.config.js` 的一般 build 會複製成品至 `platform/backend/public`；M0 無前端產品變更，且工作樹已有該目錄的其他修改，因此未跑本機前端 build，以免覆寫來源不明成品。

## 5. Gate 與停止點

| Gate | 判定 |
| --- | --- |
| 新舊 route、event、DO 與資料 namespace 無重疊 | 候選方案成立；尚未實作。 |
| chatCore 與 dineCore 身分關係有可測試授權方案 | 候選方案已寫明；M4 尚需證明。 |
| 公開聊天室本機測試全數通過 | 通過。 |
| 手動公開聊天發送、重整、歷史回放正常 | 首次未通過；新版 Chat Worker 發布後重驗通過，詳見第 6 節。 |
| Container 核心未修改 | 通過；本階段無產品程式修改。 |

狀態：**passed（M0 Gate 通過）**。首次失敗與部署版本落差一致；2026-10-29 已以受控 Staging Tag Workflow 發布並重驗。M0a 仍未開始，須依執行書先檢討本階段結果，再決定下一階段。

設計偏離檢查：候選方案維持獨立 Project／tenant、模組自行註冊、前端經 API 取得後端事實、公開與私人 namespace 分離。尚未成立的身分轉接沒有寫成已存在的能力；未發現本階段造成的 World、Container 或模組責任偏離。

## 6. Staging 發布與 M0 手動重驗（2026-10-29）

- 目標：`platform-chat` → `moducore-chat-poc-staging`。全新 Tag：`dep_platform-chat_v0.1.11`，來源 Commit：`ca8ac47e6d4b94a8df400f8c2eb9ce41c1081167`。推送前確認遠端沒有同名 Tag／Release，且 Worker／Chat 契約／Workflow 相關檔案無未提交修改；沒有納入工作樹中的無關文件或產物。
- 發布前驗證：`platform/worker` 的 `npm test` 74/74 通過；`npm run check -- --config wrangler.chat-poc.jsonc` dry-run 通過。既有前端 Chat 8/8、公開契約 4/4 已在首次 M0 驗證通過。
- [GitHub Actions Run 40824297492](https://github.com/takoson68/moducore_platform/actions/runs/40824297492) 完成且結論 `success`；Worker 測試、bundle、WebSocket Smoke、Release 發布與 Deployment 記錄均通過。[Release `dep_platform-chat_v0.1.11`](https://github.com/takoson68/moducore_platform/releases/tag/dep_platform-chat_v0.1.11) 含 ZIP、manifest、SHA-256 三項資產。Cloudflare `wrangler deployments list` 顯示新版本 `c87c5a13-a8c7-42ad-92ec-65ef2be72307` 為 100% active。
- 手動重驗：在 `game-demo-staging.takoson68.workers.dev/` 新連線，送出「M0 重驗合成訊息」後當頁可見；重整並展開聊天室後，`chat.history` 回放使同一訊息仍可見；另開同站分頁後同樣可見。game-demo 前端顯示版本 `v0.1.17`，本次只更新 Chat Worker，未改動該前端版本或 dineCore Worker。
- 影響與限制：公開聊天室的 Staging 版本已更新，這是為修復首次 M0 線上歷史驗證差異而進行的單一目標發布；沒有發布 Production。未實測真正的 Durable Object hibernation／wake 週期、chatCore Auth 轉接或 P2P；它們屬後續里程碑。
