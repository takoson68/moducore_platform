# chatCore 文件索引

本目錄管理私人聊天室技術實驗的里程碑、驗證結果與尚未裁決的技術問題。

## 閱讀順序

1. [`P2P_CHAT_MILESTONES.md`](./P2P_CHAT_MILESTONES.md)：完整實驗範圍、已確認決策、里程碑與 Gate。
2. [`M0_RESULT.md`](./M0_RESULT.md)：M0 隔離邊界與 Staging 歷史回放驗收結果。
3. [`M0A_RESULT.md`](./M0A_RESULT.md)：chatCore 入口與控制台實驗結果。
4. [`M1_RESULT.md`](./M1_RESULT.md)：雙瀏覽器 WebRTC DataChannel、聊天室連結與 Staging Signaling 結果。
5. [`M1B_RESULT.md`](./M1B_RESULT.md)：五人以下 Full Mesh 聊天室連線擴充結果。
6. [`M2_RESULT.md`](./M2_RESULT.md)：裝置本機 IndexedDB 歷史與 outbox 結果。
7. [`M3_RESULT.md`](./M3_RESULT.md)：received／persisted ACK、messageId 去重與 READ 結果。
8. [`M4_RESULT.md`](./M4_RESULT.md)：dineCore 來源驗證、ChatCore Session、一次性房間 Ticket 與 20 人／裝置實驗上限。

## 本機 IP IndexedDB 測試

啟動 chatCore 開發伺服器後，以終端機輸出的 Network 網址，或本機區域網路 IP 加 Vite 埠開啟 `/ip-test`。此路由是獨立的聊天測試頁，包含房間清單、房號加入／建立、聊天與備份入口；原本的 `/console` 控制頁保持獨立。chatCore 預設 HTTP 開發埠為 5181；埠被占用時以 Vite 顯示的下一個可用埠為準。透過 localhost 與 IP 網址分別開啟時，瀏覽器會使用不同 origin，各自擁有獨立的 IndexedDB。從一個網址寫入後，另一個網址不會自動讀到該資料，可用來測試分類和上傳。

開發 API 基址會跟隨目前頁面 hostname，使用相同 hostname 的 8787 埠。需啟動 ChatCore Worker；目前 Worker 以 Session Secret 與 DineCore Staging Auth Service 驗證登入。開發環境的 `/console` 預填 `admin1`、`/ip-test` 預填 `admin2`，各自使用已驗證的合成測試密碼；測試結束後須移除預填密碼。透過 localhost 與區網 IP 各自登入時，Origin 的 Session 與 IndexedDB 彼此分開。已建立或加入的房號由 ChatCore Worker 提供共用清單；舊版僅在瀏覽器保存的房號，需重新載入 `/console` 並登入後同步。清單記錄房號，不表示目前有人在線。

私人聊天模組優先使用原本的 `crypto.randomUUID()`；區網 HTTP 網址沒有此函式時，才使用 `crypto.getRandomValues()` 產生符合相同格式的 UUID。兩條路徑並行，區網測試頁已驗證入房，完整多人訊息與備份流程仍待驗收。

## 手動聊天備份

登入後點「IndexedDB 備份」，再選「上傳 IndexedDB 備份」。確認後，模組在單一 IndexedDB 讀取交易中收集全部房間的 `messages` 與 `outbox`。來源依瀏覽器 Origin 分區，未依登入會員分區。

固定端點 `/api/backups` 驗證 `X-Project: chatCore` 與 chatCore Session。POST 將版本 1 的明文 JSON 存入專案共用的 SQLite-backed Durable Object，單份上限 1 MiB。GET 列出所有共用備份的時間、大小與上傳者，GET 加上 `?id=<備份識別>` 下載原始 JSON。所有已登入的 chatCore 實驗會員都可下載。舊版以會員 ID 儲存的備份會在原上傳者開啟清單時匯入一次，匯入後所有實驗會員都看得到。實驗範圍限合成測試訊息。

`/console` 與 `/ip-test` 皆可從「IndexedDB 備份」選擇「下載備份檔案」列出版本。離開聊天室後選取要還原的版本並確認，前端下載完整 JSON 並驗證，再用一筆 IndexedDB 交易完整覆蓋 `chatCore_private_chat` 的兩個 Object Store。成功後重新載入頁面。還原前請關閉同一 Origin 的其他聊天分頁。

還原會清空 `messages`（聊天訊息）與 `outbox`（待送訊息），再寫入所選快照。備份中沒有的本機紀錄會移除，其他 IndexedDB 資料庫維持原狀。下載或驗證失敗時保留原資料。清空與寫入在同一筆交易內執行，交易失敗會回滾。

Project 身分及實驗發布邊界見 [`D001_project_identity.md`](../decisions/D001_project_identity.md) 與 [`D002_remote_experiment.md`](../decisions/D002_remote_experiment.md)。

里程碑計畫與 M0 結果已複製到本 Project，作為後續專案內的正式閱讀入口；原 `_workspace/_reports/2026-10-29_chatcore_p2p_plan/` 保留建立過程的報告存檔。
