---
status: active
updated: 2026-11-17
authority: work-state
---

# 當前工作

## 2026-11-17 yi-ly AI 解籤提示 Staging v0.1.3

複製給外部 AI 的提示已改為「逐句釋詞與意象 → 分析情勢與象徵 → 將詩意對照問題提出可能方向」，要求列出詩句依據、區分原文／字義／推論，並保留不確定性。Commit `ee52fa4b40f7b031d3d6108055c27f50d374c3c1`、Tag `dep_yi-ly_v0.1.3` 已推送；GitHub Actions `44057100849` 成功，Worker 測試、D1 檢查與部署 Smoke 通過。Release ZIP、manifest、checksum 已發布；線上首頁載入 `index-DQEc9bBF.js`，確認含新版提示，`/api/health` 顯示 Worker 與 D1 正常。Staging：https://yi-ly-staging.takoson68.workers.dev 。本機 `platform/frontend/.env` 修改未納入。

## 2026-11-17 yi-ly 紙墨 UI Staging v0.1.2

易占首頁完成緊湊比例與宣紙水墨視覺，起卦／倒數圓相改為由左下起筆逐段描繪；複製來源列會移除版本欄位中重複的來源名稱。同步將 Yi-Ly 加入 Tag 部署手冊。Commit `7aa69c97b746c43e4f116ef134c68a509bc32957`、Tag `dep_yi-ly_v0.1.2` 已推送；GitHub Actions `44055061517` 完成成功，前端 build、Worker 82 項測試、Worker dry-run、D1 相容檢查／migration／語料 seed、Staging Worker 部署與 Smoke 全部通過。Release ZIP、manifest、checksum 已發布。首頁載入 `index-BXInvZjj.js` 與 `style-MJksN1Fy.css`；`/api/health` 回傳 Worker／D1 正常。Staging：https://yi-ly-staging.takoson68.workers.dev 。本機 `platform/frontend/.env` 修改未納入部署提交。

## 2026-11-17 yi-ly Staging 首次發布與 UI 微調

新增獨立 `yi-ly-staging` Worker／D1 發布目標；遠端 D1（`b06bec43-9087-48d0-92f5-a7869e44d5c4`）已套用 Migration 並匯入來源語料。Seed 為 11 MB：64 卦、1,005 段卦頁原文、795 段傳文、4,096 首焦氏易林，142 個來源頁。Commit `1453951` 與 Tag `dep_yi-ly_v0.1.0` 已推送，Workflow `44045082761` 成功，公開首頁、D1 health、reading API 與 smoke 均通過。首次 smoke 在 Worker 資產傳播完成前遇到 HTTP 404；人工重跑後通過，後續發布流程已加入有限重試。最新版 UI 加入手機安全區、560px 內容最大寬度、左上「易」刷新按鈕、較清楚的提問／起卦視覺層級與鍵盤 focus 樣式；手機 390px 預覽及刷新操作確認正常，前端 build 通過。UI／smoke 重試修正已提交於 `5fb0404` 並以 `dep_yi-ly_v0.1.1` 部署；Workflow `44046027931` 成功。已再次確認首頁 HTML 200、`/about` 200、D1 health 正常、乾淨卦象查詢回傳井之升與對應易林詩辭；線上載入新版 CSS/JS。Staging 網址：https://yi-ly-staging.takoson68.workers.dev 。`.env` 未納入提交。

## 2026-11-17 yi-ly 第一版卜卦 UI 與唯讀經文查詢

已新增 `casting` Module：支援實體三錢六爻手動輸入及倒數後六鍵計時取數，完成本卦／之卦計算與結果呈現；核心經文及傳文由 Worker 唯讀 `/api/yijing/reading` 按卦畫查詢，附來源、版本、授權及機器整理聲明。傳文預設折疊；《焦氏易林》結果直接展開並置於「經文原文」前，只有使用者勾選才加入外部 AI 複製內容。卜卦歷史預設不保存，使用者透過保存按鈕明確寫入 World IndexedDB；首次保存需自行輸入名稱，之後預填最近一次使用者自訂名稱。Vite 開發代理已為 `yi-ly` 指向本機 Worker `127.0.0.1:8787`。驗證：前端 production build 成功；本機瀏覽器完成一次金錢卦及考變占切換檢視；未跑測試。剩餘：朱熹考變占二、四變原典核對、離線下載／啟用、簡明導讀及正式遠端 Worker/D1 部署。未 commit/push/deploy。

後續更新：結果頁已增加原文通覽／朱熹《易學啟蒙・考變占》切換。考變占依動爻數選取卦辭、爻辭或用九／用六；二變以上爻優先、四變以下爻優先依目前產品規則表實作，介面與決策文件均標示仍待原典例證核對。選擇的閱讀方式會寫入本機歷史並帶入外部 AI Context。以本機 D1 和瀏覽器完成一次六爻全動實際操作，手動輸入解析為第 1 卦乾之第 2 卦坤，唯讀 API 回應 200，切換考變占後顯示乾卦用九；前端 production build 成功。其他本站分析視角、離線流程與簡明導讀仍未完成。

使用者回饋後，《焦氏易林》詩辭調整為結果頁直接展開並置於「經文原文」上方；原文閱讀方式仍分開切換，詩辭只有勾選「複製時附帶此詩辭」才加入外部 AI Context。三錢按鈕改以「正／反」呈現，輔助文字說明正面 3 點、反面 2 點，技術值映射維持不變。這兩項 UI 調整已通過前端 production build。

2026-11-17 排除前端 `/api/yijing/reading` 500：前端 Vite 代理目標是 `127.0.0.1:8787`；重現時專用 Wrangler Worker 未啟動。啟動 `wrangler.yi-ly-local.jsonc` 後，同一組 `basePattern=011010&changedPattern=011000` 經 Worker 直連及 `192.168.50.113:5181` 前端代理均回 200，資料為井之升並含對應易林詩辭。目前本機 Worker 保持執行，使用者可重整頁面確認。已將雙終端啟動方式補入 `corpus/tools/index.md`。

已將外部 AI 交接收斂為「複製問題與《焦氏易林》詩籤」單一操作，複製模板只含使用者問題、詩籤原文、來源署名與權利聲明，以及要求 AI 不引用其他卦辭／傳文／術數並區分原文與推論的提示；不會自動開啟或送出到 AI。支援 Clipboard API 與區網 HTTP 下的相容複製備援；備援失敗時顯示可手動選取複製的全文。已同步更新產品需求與技術架構文件。

使用者指定預設起卦方式為「時機取數」；首頁初始狀態已切至六鍵計時，手動實體三錢仍可切換，重新起卦沿用目前方式。D003、需求規格與 Project 情境同步更新。

使用者改定歷史紀錄名稱：第一次保存留白並必須由使用者輸入，後續預填最近一筆 `nameOrigin=user` 的紀錄名稱；舊版系統預填 TAKO 的歷史不作為初次預填來源。前端 build 通過。使用者授權部署後，已新增 `yi-ly-staging` Staging 白名單、獨立 Worker 設定、專用 D1、Migration 與發布時來源語料 seed 步驟；目前正進行首次 Staging 發布。

## 2026-11-17 yi-ly 本機 D1 資料庫

使用者決定經文不經人工校字或改寫，資料庫直接由既有來源快照與機器解析 staging 建立。已新增 `platform/worker/migrations/yi-ly/` 專用 schema、本機 Wrangler 設定及 `corpus/tools/build-d1-seed.mjs`。本機 D1 載入 64 卦、1005 段卦頁原文、795 段傳文及 4096 首《焦氏易林》；來源頁 142 筆。易林初次匯入發現篇內序號會重複，已新增 migration 取消錯誤唯一限制並補齊。核對結果：64 卦畫、4096 唯一易林配對、來源頁缺漏 0、卦畫長度錯誤 0。僅修改本機 D1，沒有遠端資料操作。下一步適合先做金錢卦確定性演算與結果 schema，再做結果頁及 AI 複製；避免先接 AI，讓原始卦象和選讀規則清楚可見。

## 2026-11-17 yi-ly 周易語料與焦氏易林整理（來源紀錄）

使用者確認納入《焦氏易林》，並將朱熹《易學啟蒙・考變占》列為選配閱讀方式。易林按本卦→之卦保存林辭，收錄目標 64×64＝4096 條；焦延壽只記為傳統題署，不把作者歸屬爭議寫成定論。考變占已記錄 0–6 動爻選讀表；二變、四變屬依例推演，三變主次需依原書例表進一步核對。已改採易學網《焦氏易林［四庫全書版］》，64 個本卦頁均完成文字擷取，取得 4096 條非空正文及 4096 個唯一配對；第 56 卦篇第 49 條來源圖示誤標為第 4 卦，正文按文字標籤／卦名定位並保留異常旗標。全文仍需人工校勘，尚未進 canonical 或 release；未實作閱讀 UI。詳見 `corpus/reviews/2026-11-17-jiaoshi-yilin-complete-capture.md`。

《陸敕先校宋本》雖標示校對完成，但第 34 卦篇第 38 條明示缺文並以四庫本代文，故排除；`/article/2162` 為缺頁注本，也不採用。現採易學網《四庫全書版》（`https://www.eee-learning.com/book/giauii`），依據《欽定四庫全書》子部術數類。網站聲明古籍原文屬公共領域，非商業合理轉載／引用須完整署名及提供原網頁連結。收錄只包含本書林辭，不混採其他版本、不抓取其他作品、不下載圖檔或自行 OCR；易林第一版不要求離線包。兩冊先前下載的 1907 掃描 PDF 已在文字收錄完成後刪除。來源 metadata 在 `corpus/sources/jiaoshi-yilin-candidates.json`。

使用者補充資料量分層架構：基礎語料（含易林 4096 條）、卦級分類、版本化規則與執行期組合。已加入資料管線 schema 草案，新增易林配對、卦分類、閱讀規則等邏輯資料集；以來源 passage ID 組合，不為每個卦變重複人工撰稿。用神規則須綁定指定卜法／流派。第一版維持外部 AI 複製 Context，站內 LLM 只列未來可能、不視為已決策。分類清單與 64 卦覆蓋策略尚未定稿。

已為原 9 個傳文入口完成 parser v4 staging，共 795 段候選資料；64 卦 staging 為 parser v2，共 1005 段。入口中 5 篇為轉址，已另存目標頁固定 revision，未動原始 73 頁 manifest／快照。《大象》《小象》《彖》《文言》保留為卦頁平行來源見證；《序卦》《說卦》《雜卦》《繫辭上》《繫辭下》保留為獨立傳文。《彖》《大象》差異已抽查；《另》模板現以主讀＋一作異文方式呈現在 staging，原始 wikitext 保留。《小象》暫以 ICU 轉繁後配對 378 條，一般爻位有 74 條候選文字差異；其中 6 筆已用 CText 歷代引文作 comparison-only 旁證，未匯入語料。四筆來源爻位標記已與顯示文字分開。詳見 [平行來源比對](../platform/frontend/projects/yi-ly/corpus/reviews/2026-11-17-parallel-witness-comparison.md)。其他待確認項目包括「逐」章 6 段映射、依順序暫定的爻位及文言變體。資料仍是 `needs-human-review`，尚未進 canonical/release。下一步分類《小象》剩餘候選差異，轉換文字只供比對，不覆蓋來源原文。

## 2026-11-16 yi-ly Corpus 原始快照與 64 卦 staging

已在 `platform/frontend/projects/yi-ly/corpus/` 建立資料工作區。`tools/fetch-wikisource.mjs` 依固定目錄 revision `7907208` 取得 73 個子頁，包括 64 卦與 9 個傳文篇目；逐頁保存原始 MediaWiki wikitext、page/revision ID、固定 URL 與 SHA-256，73 筆 checksum 均核對通過。`tools/stage-hexagrams.mjs` 已產生 64 卦、1005 筆候選段落；卦序 1–64 唯一完整，各卦都有卦辭、六爻、彖傳與大象候選，未分類段落為零。所有內容仍待人工校勘；小象未明列爻位時依來源順序暫定映射，乾文言來源群組已保留。初審見 `corpus/reviews/2026-11-16-qian-kun-staging-review.md` 與 `corpus/reviews/2026-11-16-hexagram-staging-batch.md`。9 個傳文項目的解析和關係初審已完成，詳見最新停止點。

## 2026-11-16 yi-ly 易經解卦企劃與空骨架

建立 `yi-ly` 新 Project 的標準空骨架、需求規格、技術架構計畫與兩份決策紀錄。專案已確認免會員、手機優先、第一版只複製給外部 AI；離線經文需使用者同意後下載，卜卦歷史預設不保存，選擇保存時預設名稱為 `TAKO`。多種推算需求收斂為同一卦象的閱讀框架：形勢／變動／趨勢為預設，時序、內外及行動框架仍待決定是否納入 MVP。`VITE_PROJECT=yi-ly npm run build:cloudflare` 通過，尚未建立業務模組或後端實作。

## 2026-11-11 iDB_box 共用備份元件

`/console` 與 `/ip-test` 改用共用 `iDB_box.vue`，將上傳、下載與備份清單收進單一對話框。頁面將事件接回 chatCore 備份 Store。前端建置與私人聊天測試 5 項通過。

## 2026-11-11 chatCore 專案共用備份

新備份寫入 chatCore 共用空間。所有已登入實驗會員共用清單與下載權限，清單標註上傳者。舊的會員備份於原上傳者開啟清單時匯入。前端建置、私人聊天測試與 Worker handler 模擬儲存測試通過。Miniflare 仍受本機監聽權限限制。

## 2026-11-11 chatCore 多版本備份與還原

`/console` 與 `/ip-test` 提供上傳、備份清單與選取還原。Worker 以固定 `/api/backups` 保留登入帳號的多份原始快照並可讀取舊版單份備份。前端驗證完整快照後，以單筆交易覆蓋聊天 IndexedDB 的 `messages`、`outbox`。前端建置、私人聊天測試及 Worker handler 模擬儲存驗證通過。Miniflare 整合測試受限於本機監聽權限，尚未完成瀏覽器端到端驗收。

## 2026-11-11 chatCore 新訊息自動捲動

`/console` 與 `/ip-test` 在對話清單掛載或尾端訊息變更時，於 Vue 更新畫面後捲至清單底部。chatCore 前端建置與私人聊天測試 4 項通過，另以 Vue 排程測試兩頁的清單掛載、批次新增訊息及僅更新訊息狀態的行為。尚未進行雙瀏覽器實際捲動驗收。

## 2026-11-11 chatCore IP 多人聊天與 IndexedDB 測試

依使用者修正要求，UUID 產生方式保留原本的 `crypto.randomUUID()` 路徑；只有該函式不存在時才使用 `crypto.getRandomValues()` 備援，兩種方式並行。新備援仍需後續多人聊天與備份流程驗收。

使用者提供 `/ip-test` 房間連線失敗截圖；區網 HTTP origin 不提供 `crypto.randomUUID()`，在產生裝置 ID 時先拋錯。備援 UUID 涵蓋裝置、房號、Peer 與訊息 ID。已在 `http://192.168.50.44:5181/ip-test` 實際以 `admin2` 登入並加入 `room-00126450-bb6`，畫面顯示「房間已加入，等待其他參與者」。Cloudflare 前端建置通過。

已修正 `/ip-test` 入房 WebSocket 開發網址，改用頁面 hostname 的 8787 埠；區網 IP 實際 WebSocket 加入房間成功。Worker 新增已建立／加入房號的共用清單；取得 Ticket 後登錄房號，`/ip-test` 登入後讀取，`/console` 重載時同步舊本機房號。兩個 Origin 的 IndexedDB 仍各自隔離。區網 API 登入、Ticket、清單查詢均 HTTP 200，前端 Cloudflare build 通過。清單為曾建立／加入的房號，不代表在線狀態；本機測試清單含驗證用房號 `room-ip-list-check`。

已在 DineCore Staging 將兩個既有合成 `member` 帳號設為可用測試密碼；開發環境 `/console` 預填 `admin1`、`/ip-test` 預填 `admin2` 及各自密碼。兩個帳號經本機 ChatCore Worker 登入均回 HTTP 200；區網 IP 的 `admin2` 登入及 CORS 亦回 HTTP 200。測試完成後移除前端預填密碼。本機 8787 Worker 目前連至 DineCore Staging Auth Service，需保持服務運作。未在此紀錄保存密碼或 Token。

獨立 `/ip-test` 頁面以 localhost 或區網 IP 開啟，支援房間清單、房號加入／建立、P2P 聊天及 IndexedDB 備份。不同 Origin（例如 `http://localhost:5181/ip-test` 與 `http://<本機IP>:5181/ip-test`）使用不同 IndexedDB。兩頁預填不同合成會員帳密，方便雙方聊天測試。樣式維持 scoped，避免通用 `input`、`.primary` 選擇器影響其他頁面。

`/ip-test` 登入介面已恢復；頁面遇到網路錯誤時會提示 Worker 網址。使用 `wrangler.chatcore-staging.jsonc` 本機啟動 Worker 需配置本機 `CHATCORE_SESSION_SECRET`，`AUTH_SERVICE` service binding 已設為連至 DineCore Staging。

## 2026-11-10 本機 Project 開發埠配置

HTTP 開發埠以 5180 固定留給 eatGoMap（Google Maps 來源白名單），其他 Project 從 5181 開始，埠衝突時由 Vite 選下一個可用埠。HTTPS 開發維持 5174。

## 2026-11-10 chatCore 本機 IP 測試網址

在 `.env` 增加 `VITE_DEV_HOST=0.0.0.0`，Vite 會提供區域網路網址。聊天與備份 Worker API 開發基址跟隨頁面 hostname 的 8787 埠。新增 `/ip-test` 專注聊天路由、房間代碼加入與本機聊天室清單。Build 通過；localhost 與目前 LAN IP 的 `/ip-test` 均回 HTTP 200。Worker 尚需獨立啟動，登入與上傳才可端到端驗收。

## 2026-11-10 eatGoMap 固定本機測試來源

確認保留 eatGoMap 的 HTTP 開發埠 5180 與 strictPort。Google Maps JavaScript API 金鑰按網站來源授權，本機測試須使用固定的 host 與 port。原因已補入 Vite 設定旁的註解與前端索引。

## 2026-11-10 本機 Vite Project 統一由 .env 選取

本機 HTTP 與 HTTPS 開發服務由前端 `.env` 的 `VITE_PROJECT` 選擇 Project，同步套用至前端設定入口與 API Project 標頭。移除 `.env.local` 的專案覆寫及 HTTPS 指令固定的 eatGoMap；發布建置保留 CI 指定目標。已確認本機載入 chatCore，並驗證開發與發布的選擇規則。

## 2026-11-09 eatGoMap 本機收藏寫入排查

前端 5180 的收藏 API 原回應 HTTP 500，原因為本機 Worker 8790 未啟動。已套用本機尚未執行的 D1 migration 0004、0005 並啟動 Worker，健康與收藏清單回應正常。使用隔離瀏覽器連實際本機 API，驗證自訂名稱和日記寫入新 IndexedDB 並於重整後讀回；驗證攔截了 Google Maps 請求。使用者另指出地圖金鑰需允許目前測試網址，Google Cloud 設定未調整。

## 2026-11-09 eatGoMap 收藏接入 world.iDB

收藏詳情、自訂欄位與查詢失敗次數接入 map-home 專屬 IndexedDB。舊 Storage 只用於遷移與清理；成功載入 API 收藏清單並寫入有效收藏後才清理舊快取。會員選擇仍由平台 Store 使用 localStorage。前端建置通過，使用測試瀏覽器的真實 IndexedDB 與模擬收藏 API 驗證舊逐筆／清單遷移、API 失敗保留、編輯、重整、移除與失敗次數保留。依賴目前工作樹內的 world.iDB 平台實作，尚未部署。

## 2026-11-09 平台 IndexedDB 備份觸發元件

新增 `IndexedDbBackupButton.vue`，支援預設按鈕與自訂 DOM 觸發，沿用 World 的分類確認、上傳及清除流程。World 使用手冊已補上按鈕與連結範例。

## 2026-11-09 World 使用手冊

新增前端 `src/world使用手冊.md`，記錄既有 World 公開入口與 IndexedDB 讀寫、分類備份和選擇性清除範例，並從前端索引導讀。

## 2026-11-09 平台 IndexedDB 統一入口

新增 `world.iDB.save/get/list/remove/upload`，由目前 Project 取得租戶並透過 Container Service 以租戶及模組隔離資料庫，同一入口提供分類讀寫、刪除、上傳與成功後的版本比對清除。保留既有儲存與備份轉接入口。

## 2026-11-09 平台 IndexedDB 分類備份

新增 `world.services.indexedDbBackup()`，由 Project 提供分類與已授權的上傳方法。確認視窗支援選擇分類與選擇性清除，清除僅處理成功上傳且版本未變動的紀錄。新資料採模組命名空間，既有 Project、資料與 Worker 皆未接線。Project A、eatGoMap 建置通過，Chrome 以實際 IndexedDB 驗證取消、失敗保留、成功清除與保留其他分類及並行寫入。

## 2026-11-09 chatCore 手動聊天備份

獨立備份模組提供 `world.store('chatCoreBackup').requestUpload()`，聊天頁按鈕開啟確認視窗。確認後經已註冊的聊天 Store 匯出 IndexedDB 訊息與待送訊息，以明文 JSON 經 chatCore Worker 上傳。SQLite Durable Object 按帳號保存最新一份，單份上限 1 MiB。前端建置、快照與 Worker 上傳測試通過。尚未部署，下載與還原待後續處理。

## 2026-11-09 eatGoMap 會員選擇與定位圖示置中 Staging v0.1.15

已發布 `dep_eatgomap_v0.1.15`，Commit `3528cf6632ceb0234dd68004a70cf36effa0ef28`，GitHub Actions `42561388541` 成功。發布包含會員 Store、頭像與選擇畫面、定位圖示置中及身分決策說明。前端建置、API 測試 3/3、Worker 測試 81/81、Wrangler dry-run、Staging 健康與收藏 API Smoke 通過。Release ZIP、manifest、checksum 與部署紀錄已確認。線上 390×844 瀏覽器驗證首次選擇、切換頭像、重整保留與準星置中，該次驗證攔截 Google Maps 請求。

## 2026-11-09 eatGoMap 定位按鈕圖示置中

右下角定位按鈕以格線將準星水平與垂直置中。前端建置通過，390×844 瀏覽器驗證圖示與按鈕中心重合。尚未部署。

## 2026-11-09 eatGoMap 初次進入會員選擇

首次進入時顯示全頁男生／女生選擇，選擇後才載入地圖及收藏。會員 Store 經模組註冊，由平台 Store 持久化保存本機選擇；搜尋欄頭像隨選擇更新並可切換。收藏、API 與權限維持既有流程。前端建置通過，已用 320×568、390×844、1280×900 驗證首次選擇、雙頭像、重整保留、切換與取消。驗證使用備用地圖及模擬收藏 API，尚未部署。

## 2026-11-09 eatGoMap 雙列頁首與浮動導覽 Staging v0.1.14

已發布 `dep_eatgomap_v0.1.14`，Commit `5ff5b4431b19ab567faab4fa19e84f1079f20c0d`，GitHub Actions `42556840259` 成功。發布僅包含 map-home 頁面，其他工作樹修改保留。隔離建置、前端 API 測試 3/3、Worker 測試 81/81、Wrangler dry-run、線上 D1 相容性與收藏 API Smoke 均通過。Release 包含 ZIP、manifest 與 checksum，部署紀錄已寫入。線上健康端點確認資料庫正常，首頁載入的 JS/CSS 含雙列頁首、裝飾頭像及浮動導覽。手機實機與真實底圖互動未另驗收。

## 2026-11-09 eatGoMap 字標與雙列搜尋頁首

依新參考圖將 EatGoMap 字標與三個篩選置於第一列，搜尋欄與裝飾性頭像置於第二列，保留既有浮動導覽。只調整 map-home 頁面呈現。Cloudflare 前端建置通過，在本機備用地圖驗證 320、390、1280 px 寬度的頁首排版、篩選與頁籤切換。尚未驗收真實底圖或手機實機，尚未部署。

## 2026-11-09 eatGoMap 專用本機 HTTP 連接埠

eatGoMap 的 Vite HTTP 開發連接埠固定為 5180，占用時直接提示。既有 HTTPS 5174 與其他 Project 的預設連接埠維持原設定。已啟動並確認 localhost:5180 回應 HTTP 200、專案設定為 eatGoMap，另以 Vite 設定確認 project-a 預設 5173。原型文件已同步新網址、Google Maps 來源與 IndexedDB 分區說明。

## 2026-11-09 eatGoMap 頂部搜尋與浮動導覽

依兩張參考圖調整 `map-home`。頂部採淺底固定區塊、獨立品牌標誌、灰色搜尋欄與同列篩選；底部採固定於應用畫面下方的深綠浮動導覽與淺綠選取狀態。地圖延伸到導覽後方，地點卡片、定位按鈕與收藏清單底部留出導覽空間。本次只改頁面呈現，沿用既有模組註冊、Store、Storage 與 API 資料流。

Cloudflare 前端建置與指定檔案 diff 檢查通過。使用本機備用地圖與模擬收藏 API，在 320×568、390×844、1280×900 驗證導覽位置、三個頁籤切換及旅遊篩選。尚未驗收真實 Google 底圖或手機實機，尚未部署。

## 2026-11-05 eatGoMap 假資料地點詳情卡 Staging v0.1.13

已發布 `dep_eatgomap_v0.1.13`，Commit `5eae3bb46849844a9b8552fa76a613f87eb72281`。收藏地標卡新增資訊／打卡／留言分頁、記憶體假留言與假打卡，以及可互動的新增留言／打卡表單；假資料只存於目前頁面狀態，不寫 IndexedDB 或呼叫 API。只將 `platform/frontend/projects/eatGoMap/modules/map-home/pages/index.vue` 納入本次 Commit，工作樹其他修改保留。

隔離乾淨工作目錄執行 Cloudflare build 與前端 API 測試成功；Worker 測試 81/81 通過，Wrangler dry-run 通過。GitHub Actions `42007648209` 成功，完成 Worker／Static Assets 部署、D1 相容檢查、健康檢查、eatGoMap 收藏 API Smoke、Release 與 Deployment 記錄。線上 `/api/health` 回傳 `{ ok: true, service: eatgomap-staging, database: ok }`；首頁載入的 JS/CSS 已確認包含詳情卡和打卡／留言介面。Staging：https://eatgomap-staging.takoson68.workers.dev/ 。尚待手機實機查看卡片大小；建議重新載入或關閉後重開捷徑以取得新資產。

## 2026-11-05 eatGoMap 收藏詳情與紫色 Marker Staging v0.1.12

已發布 `dep_eatgomap_v0.1.12`，Commit `25ca37883c98d863bb1d070d600de431b9a5589c`。本版修正 `world.createStore` action 內部重複傳入 store 造成 Place 詳情無法寫入 IndexedDB、支援 `fetchFields()` 回傳的 `{ lat, lng }` location literal、收斂頁面開啟時自動詳情查詢為一次，並加入可點擊的亮紫色收藏星號 Marker 與 eatGoMap 自有資料卡。資料卡顯示名稱／自訂名稱、地址／自訂地址、電話與個人日記；打卡、評分、照片尚無資料契約，因此只顯示尚未建立狀態。

部署前 Cloudflare build 196 modules、Worker 測試 81/81 通過。GitHub Actions `42000192497` 成功，D1 Schema 相容檢查、Migration、Worker／Static Assets 部署、公開端點、收藏 API persistence Smoke、Release 與 Deployment 記錄均通過。線上健康檢查回傳 `{ ok: true, service: eatgomap-staging, database: ok }`，首頁 HTTP 200。Release 已建立並包含 ZIP、manifest、checksum。Staging：https://eatgomap-staging.takoson68.workers.dev/ 。未執行手機端紫色 Marker 點擊與 IndexedDB 實機驗收；手機若仍顯示舊資產，需強制重新整理或關閉後重開捷徑。

## 2026-11-05 eatGoMap 本機收藏 GetPlace／IndexedDB 根因修正

收藏地圖 Marker 改為高辨識亮紫色星號（`#a855f7`），卡片縮圖同步使用紫色漸層。Marker 現在可點擊並開啟 eatGoMap 自有地點卡，顯示本機保存的名稱／自訂名稱、地址／自訂地址、電話與個人日記；打卡、評分與照片尚無資料契約，卡片明確顯示未建立狀態且不偽造內容。「建立打卡」目前只提示功能尚未建立。D008 與 MAP_HOME_PROTOTYPE 已同步。Cloudflare build `/tmp/eatgomap-purple-favorite-marker` 成功（196 modules），本次檔案 `git diff --check` 通過。未部署或 Commit／Push；尚待本機重載後點擊紫色 Marker 驗收。

階段式 Log 找到最終根因：`world.createStore` 會把底層 store 自動注入 action 第一參數，但 `map-home/store.js` 的 action 內部呼叫寫成 `store.persistPlace(store, payload)`，重複傳入 store，導致 `persistPlace` 實際收到的 `place` 是 Store 本身並拋出「拒絕保存沒有有效 Place ID 的地點資料」。已將六處同型呼叫全部改為 `store.persistPlace(payload)`，並移除本次暫時診斷 Log；精確搜尋確認不再存在 `store.<action>(store, ...)`。Cloudflare build `/tmp/eatgomap-store-action-args-fix` 成功（196 modules），本次檔案 `git diff --check` 通過。未部署或 Commit／Push；本機完整重載後，既有空殼收藏會重新查詢一次並應正確保存詳情。

使用者再次提供 IndexedDB 截圖，兩筆有效 Place ID 仍只有空殼，`detailsFetchedAt`、失敗數與錯誤皆為 0；已確認 Google `fetchFields()` 回傳完整，因此追蹤範圍收斂到 Store 正規化、Storage set/get 與讀回核對。新增不會觸發額外請求的階段式 Console 診斷：`[eatGoMap][Place Details] Store 正規化結果`、`[eatGoMap][IndexedDB] 準備寫入地點詳情`、`[eatGoMap][IndexedDB] 寫入後原始讀回`、`[eatGoMap][IndexedDB] 地點詳情保存失敗`，頁面 catch 另輸出 `[eatGoMap][Place Details] 更新收藏詳情失敗`。Cloudflare build `/tmp/eatgomap-storage-trace` 成功（196 modules）。待使用者完整重載後提供最先停止的 Log；尚未部署或 Commit／Push。

使用者提供實際 `fetchFields()` Log，確認 `response.place`、`responsePlace`、`requestedPlace` 均含正確 `id`、`displayName`、`formattedAddress`、`location: { lat, lng }` 與 `nationalPhoneNumber`。實際落地斷點是頁面只用 `place.location?.toJSON?.()` 取座標；本次回傳的 `location` 可直接讀取 `{ lat, lng }`，若沒有 `toJSON()` 就會被轉成 `undefined` 並遭完整性檢查拒絕。現改為 `toJSON()` 結果或原始 location literal，並移除暫時原始資料 Log。D008 已記錄實際欄位與兩種 location 形狀。Cloudflare build `/tmp/eatgomap-location-literal-fix` 成功（196 modules）。未部署或 Commit／Push；本機需完整重載一次驗證 IndexedDB。

依使用者要求先觀察實際 SDK 資料格式，不再調整欄位映射。`fetchPlaceDetails()` 現在於 `fetchFields()` resolve 後立即以 `[eatGoMap][Place Details] fetchFields 原始回傳` 輸出當次 `placeId`、完整 `response`、`response.place` 與原始 `requestedPlace`；不包含 API key，也沒有新增請求。Cloudflare build `/tmp/eatgomap-place-details-console-log` 成功（196 modules）。需完整重載本機頁面後在 Console 搜尋上述前綴，展開物件確認實際欄位，再決定保存映射。

使用者重載後提供 IndexedDB 截圖：有效 Place ID 記錄仍為空欄位、`detailsFetchedAt: 0`、失敗數／錯誤皆為 0，證明該次只完成 hydrate，詳情刷新沒有走到成功或失敗落地。進一步移除切換「收藏」頁籤時的整批刷新入口；頁面生命週期增加一次性 Gate，僅在 hydrate 與 Places library 完成後逐筆 `await` 過期詳情更新。`fetchFields()` 優先讀正式回傳的 `response.place`，並兼容 Google 官方範例採用的原始 `requestedPlace`。Cloudflare build `/tmp/eatgomap-single-refresh-fix` 成功（196 modules）。未重載使用者頁面、未呼叫 Places API、未部署或 Commit／Push；仍需使用者再次完整重載後觀察同一 ID 是否只出現一次 `GetPlace`，以及 IndexedDB 成功欄位或明確失敗狀態。

追查實際資料流後確認，瀏覽器 Network 中 `GetPlace` 的位置式陣列是 Google Maps JavaScript API 的內部傳輸格式，不會直接交給 eatGoMap Store；先前在 Store 依陣列索引正規化，因此沒有接上真實執行路徑。`Place.fetchFields()` 的正式回傳型別是 `{ place: Place }`，頁面原先丟棄回傳值並改讀建構時的原始 `Place`。現已改由回傳的 `place` 讀取 `displayName`、`formattedAddress`、`location`、`nationalPhoneNumber`，再交給 Store 驗證及寫入 IndexedDB；移除 Store 對內部位置式陣列的猜測。

頁面開啟時的詳情自動更新已收斂成單一入口：收藏 hydrate 與 Places library 都完成後只執行一次，不再由 items watcher 重複觸發。Store 保留同 Place ID 請求合併與最多兩次失敗限制。`favoriteId()` 另拒絕字串 `undefined`／`null`；hydrate 會依有效 API 收藏清單移除 `eatGoMap:place:undefined` 等歷史髒 key。未猜測或限制 Google Place ID 的合法字串格式。

精確 `git diff --check` 通過。`npm run build:cloudflare -- --outDir /tmp/eatgomap-place-response-fix` 成功（196 modules）。全工作樹 `git diff --check` 仍只回報既有 `_workspace/成熟常用指令.txt` 尾端空白，本次未修改。診斷與修正期間沒有重載 localhost、沒有觸發 Places API、沒有修改 D1／IndexedDB、沒有部署或 Commit／Push。本機 Vite `http://localhost:5173/` 正在執行且已提供新程式；要驗收必須完整重載一次，讓先前 `World not started` 的頁面重新 boot。預期每個缺漏／過期且未達兩次失敗上限的有效收藏 Place ID 只送出一次 `GetPlace`，成功後同一筆 IndexedDB 應有名稱、地址、座標與大於 0 的 `detailsFetchedAt`；電話若 Google 無資料可為空。Staging 驗收才需要另行部署。

## 2026-11-05 eatGoMap 位置式地標資料映射修正

使用者提供底圖地標的實際位置式陣列，含索引 6 電話、8 地址、11 `[lat, lng]`、30 `[名稱, 語系]`。原 Store 僅讀具名欄位物件，因此此陣列若送入會漏掉名稱／地址／座標並使資料無法落地。`map-home/store.js` 現在會將此陣列與 Places 具名欄位物件統一正規化；更新詳情時先驗證名稱、地址與有效座標，格式缺漏則記錄一次失敗並遵守每個 Place ID 最多兩次連續失敗的既有限制。`D008` 已記錄欄位索引及其輸入形狀限制。`npm run build:cloudflare -- --outDir /tmp/eatgomap-array-mapping-check` 成功（196 modules）。未執行測試、未部署、未 Commit／Push。注意：目前底圖 click event 在應用程式中仍只提供 Place ID，`Place.fetchFields()` 路徑回傳具名 Place 欄位；這次修正讓 Store 能接納使用者提供的陣列格式，但尚未證明該陣列會由現行瀏覽器事件自動送進 Store。要用該筆特定資料立即補存，仍需其 Place ID 及來源連線。

使用者接著明確要求修好「點收藏 → 取得資料 → IndexedDB」流程。已確認原流程為先 POST Place ID，再透過 `Place.fetchFields()` 取得名稱、地址、電話、座標並寫本機。新增保存後立即從同一 Storage capability 讀回核對；資料不完整或座標超界不視為成功。點擊時若 Places library 未載入，現在會在建立收藏前停止並提示。Build `npm run build:cloudflare -- --outDir /tmp/eatgomap-favorite-idb-write-check` 成功（196 modules）。尚未在瀏覽器端對真實地標做點擊驗收，未部署、未 Commit／Push；既有達兩次失敗的 ID 仍不會自動重試。

使用者提供本機收藏頁仍只有 Place ID 的截圖。追查新增收藏時，Store 的 ID 清單監看器會啟動詳情查詢，而按鈕處理器也立即呼叫更新；Store 會合併相同 Place ID 的請求，但 UI 層原先看到 `loadingFavoriteIds` 就直接回傳 `false`，未等待進行中的請求，導致按鈕流程過早判定資料未保存。已移除 UI 層這個短路，讓兩條路徑共用並等待 Store 同一請求。待 build 與瀏覽器驗收；未執行測試、未部署、未 Commit／Push。

Cloudflare build `npm run build:cloudflare -- --outDir /tmp/eatgomap-favorite-race-check` 成功（196 modules）。用戶本機頁面檢查時，當前 localhost tab 已空白，console 顯示 Vue setup 的 `World not started`；因此沒有重載頁面，避免載入收藏時自動再次呼叫 Places，未能做真實收藏驗收。尚未部署、Commit／Push。

## 2026-11-05 eatGoMap Places Details 重試循環與收藏錯因追蹤 v0.1.11

使用者回報收藏後詳情未落地、查詢失敗時畫面重複跳錯，並要求同一 Place ID 連續兩次失敗就停止。v0.1.9 對收藏項目 ID 做 alias 正規化／缺值防護；v0.1.10 加入 Place Details 15 秒逾時、名稱／地址／座標完整檢查與兩次失敗上限，僅在詳情確實寫入 IndexedDB 時回報成功。測試瀏覽器顯示三筆收藏各已達兩次失敗，停止後續呼叫。直接原因為 `watch(...items, { deep: true })` 監聽到失敗次數寫回 Store，立即再次觸發同一 Place Details 查詢；v0.1.11 改為只監聽收藏 ID 清單變動，另將錯誤訊息（隱藏 API key）存到 IndexedDB 並顯示於收藏卡。Staging v0.1.11 已發布：Commit `f729972a901ef8a4aad0cc582d3c4e7fa018341e`、Tag `dep_eatgomap_v0.1.11`、Workflow `41991236856` 成功。前端 build 74 modules、Worker 測試、部署 Smoke 與健康檢查均通過。Place Details 精確錯因仍無法從既有失敗還原，因先前版沒有保存錯誤訊息，且測試瀏覽器內該三筆 ID 已到兩次上限，不會為了診斷再呼叫。曾恢復先前已存在的 Place ID `ChIJG9CYlmCpQjQRUPsSe31WS4I`，但稍後 API 清單再次變動；最新唯讀檢查只回傳 `ChIJ0aRZ3GepQjQRc_WIUd_mZiY`，不再自行增刪以免覆蓋使用者測試。每次 `Place.fetchFields()` 是一次 Places Details 嘗試；目前每個 ID 每個瀏覽器最多兩次連續失敗，IndexedDB 本機保存失敗數，不是跨裝置全域限制。Staging：https://eatgomap-staging.takoson68.workers.dev/ 。

## 2026-11-05 eatGoMap 收藏重整後清單修正 v0.1.8

使用者回報按收藏後重整，收藏資料不見。查證 Staging D1 已有收藏 Place ID `ChIJG9CYlmCpQjQRUPsSe31WS4I`；前端 `hydrate()` 對 `world.services.storage().list()` 傳入尾端冒號的 namespace（`eatGoMap:place:`），違反 Storage key 格式並中斷收藏清單載入。已修正 namespace 與逐筆 key 篩選，Commit `00056145c09da76a4fa8612b8170c5294e917b61`、Tag `dep_eatgomap_v0.1.8` 已推送並部署；GitHub Actions `41987985774` 成功，健康檢查回傳 `{ ok: true, service: eatgomap-staging, database: ok }`。部署後重新載入頁面並進入「收藏」，介面顯示 `1 個收藏地點` 與已保存 Place ID，確認清單重整後仍存在。驗證使用的獨立瀏覽器沒有該地點的 IndexedDB 詳情，所以呈現短 ID 與 Place ID；使用者原瀏覽器若保有本機詳情仍可顯示名稱／地址。Staging：https://eatgomap-staging.takoson68.workers.dev/ 。

## 2026-11-05 eatGoMap Place ID 與 IndexedDB 詳情更新流程

依使用者確認的流程完成本機修改：D1 `eatgomap_favorites` 收斂為只含 `place_id`，Worker API 僅支援清單 GET、Place ID POST 與 DELETE；新增 `0005_place_id_only.sql` 保留既有 ID 並移除來源、建立時間及自訂欄位。前端 Store 經 `world.services.storage()` 以 `eatGoMap:place:{place_id}` 逐筆保存名稱、地址、座標、電話、使用者自訂名稱／地址及個人日記。搜尋結果沿用當次欄位；底圖 POI 在收藏成功後以 ID 查詳情。缺資料或詳情超過 30 天時，在載入收藏時按 ID 查詢並更新，同 ID 請求合併；API 回傳 ID 清單仍是收藏權威，移除收藏時刪除對應本機資料。

新增決策 D008 並更新 Project 文件、Worker 測試契約與 Staging Smoke 腳本。Worker 測試 81/81、前端 API 檢查 3/3、前端 Cloudflare build 74 modules、專用 Worker dry-run 與隔離本機 D1 五筆 Migration 均成功。已發布 `dep_eatgomap_v0.1.7`，Commit `5e47fa8533cc2379b4d067670f2852afbd0e7fe3`；GitHub Actions `41987102117` 完成，遠端套用 Migration、部署 Worker／Assets 與收藏 API Smoke 均通過，健康檢查回傳 `{ ok: true, service: eatgomap-staging, database: ok }`。部署網址：https://eatgomap-staging.takoson68.workers.dev/ 。已在瀏覽器開啟新版首頁；尚未手動驗收收藏、重新整理、逾期重查與 Marker 流程。Google 官方條款對 Place ID 與座標有明確留存說明，但此實作依使用者要求暫存名稱、地址及電話；D008 已註明需另行確認這些欄位的適用政策，不宣稱符合 Google 留存條款。

注意：工作樹有大量其他既存修改，本次僅在 eatGoMap 收藏流程及其直接文件、Worker API/Migration 範圍內修改；未清理或覆蓋其他 Project 變更。

## 2026-11-05 eatGoMap 前一階段收藏落地與地圖標記

使用者要求收藏成功後進入收藏列表，資料保存於瀏覽器，以便地圖顯示收藏點。已完成前端流程：收藏先 POST Worker API/D1，成功後寫回 `eatGoMapFavoriteStore` 並透過 `world.services.storage()` 保存 API 投影；可用座標另存在瀏覽器，地圖據此建立深綠星號 Marker。搜尋結果收藏沿用 Places API 當次已取得的座標；底圖 POI 收藏不額外查 Place Details，也不保存 map click event 的游標位置。尚無座標的收藏仍會顯示於收藏頁，使用者可明確載入地點資訊取得位置。

Google Place ID 可長期保留；Google Places 緯經度於瀏覽器快取最多 30 日並在到期時清除。Google 回傳名稱／地址只留在當次頁面記憶體；收藏列表重整後若沒有使用者自訂名稱會先顯示 Place ID 短碼，使用者可手動輸入名稱／地址保存。依 Google [Places API policies](https://developers.google.com/maps/documentation/places/web-service/policies) 與 [Maps Service Specific Terms](https://cloud.google.com/maps-platform/terms/maps-service-terms)。

Cloudflare build 74 modules 成功；未執行測試、未部署、未 Commit／Push。尚待瀏覽器實際點收藏／重整／觀察地圖標記驗收；Staging D1 Migration/Worker 仍未部署。

## 2026-11-05 憲法優先導讀與一致性修正

使用者要求 AI 導讀明確以 World 憲法為最高準則，並指出 eatGoMap、chatCore 曾未依模組 Store 規則實作。已調整 `AGENTS.md`、`_ai-context/AI_IMPLEMENTATION_GUIDE.md`、`_ai-context/導讀規則.md` 與 `_ai-context/index.md`：工程前完整閱讀 RootIndex 指定的 World 主鏈 00–09；把憲法與適用 Contract 轉成檢查點；入口衝突依 `STARTUP_DECLARATION.md` 停止受影響工作；結束前逐項檢查，不得以現況或測試通過合法化違規。未修改 `_VibeCore/world/`。

eatGoMap 已增加並註冊 `map-home/store.js`，收藏狀態由 Worker API/D1 為權威，透過 `world.services.storage()` 快取；Google Places 名稱／地址／座標不進本機持久層或 D1，底圖 POI 收藏不呼叫 Place Details。已修正 `saveManualLabels` 重複呼叫 PATCH API 的錯誤。D1 遠端 Migration 尚未套用、Worker 尚未部署。

chatCore 已增加並註冊 `private-chat-lab/store.js`；房間清單與 deviceId 改用平台 Storage capability，訊息/outbox 執行狀態進模組 Store。但檢查發現 `messageRepository.js` 仍直接呼叫 IndexedDB，違反 `platform/frontend/src/app/container/services/storage.md` 的唯一 I/O 入口規則；先前 M2 報告以可靠持久化作例外，不能凌駕正式 Contract。此項尚未修正，故不可宣稱 chatCore 已符合憲法。下一步需回到 `platform/frontend/index.md` 與 services 索引，設計具備原子交易與不靜默降級語意的正式 Storage capability，再將 Repository 改由 capability 執行；不要以模組私自操作 IndexedDB 充當豁免。

eatGoMap 與 chatCore Cloudflare build 均成功（分別 74、83 modules）；未執行測試。`git diff --check` 只回報先前已修改的 `_workspace/成熟常用指令.txt` 有尾端空白，本次未觸碰該檔。未部署、未 Commit／Push。保留工作樹其他既有修改。

## 2026-11-05 eatGoMap 暫用 D1 API Staging 部署準備

使用者補充收藏頁需能點擊名稱，手動輸入自訂名稱與地址並存入 D1。前端編輯欄只回填先前已存的使用者自訂值；Google Places 回傳值只在目前頁面暫存，需要時另以 Place ID 查取，不自動放入自訂欄。D1 保存 Place ID、自訂欄位；Google 回傳座標最多 30 天並由每小時排程及讀取路徑清除。已新增 0003 自訂欄位 Migration、PATCH API、收藏頁編輯 UI 與測試；待 Migration／Worker 測試、前端 build、部署流程驗證。Cloudflare 已建立空的 `eatgomap-staging-db`（APAC，UUID 已寫入設定），遠端 Migration 尚未套用，Worker 尚未部署，也未 Commit／Push／Tag。Google Maps 儲存政策：[Places policy](https://developers.google.com/maps/documentation/places/web-service/policies)、[Service Terms](https://cloud.google.com/maps-platform/terms/maps-service-terms)。

## 2026-11-05 eatGoMap 底圖 POI 免 Place Details 流程

已將 Google 底圖 POI 點擊改為保留原生資訊窗，透過 Maps click event 的 `placeId` 顯示 eatGoMap 自有收藏操作；此路徑不呼叫 Place Details，也不擷取原生資訊窗文字。收藏目前僅存在頁面記憶體，尚未接後端／跨裝置同步。Places 搜尋建議選取仍呼叫 Place Details 取得名稱、地址、座標。已同步 D004、模組索引、Prototype 與 Project Brief。尚待 Cloudflare build 與實機 POI 點擊驗收；未部署、Commit 或 Push。

## 2026-11-04 eatGoMap Google 原生 POI 資訊窗與收藏決策

已確認底圖 POI 收藏採 Google 原生資訊窗展示 Google 提供的內容；eatGoMap 另放自有收藏操作，收藏時只保存 `placeId` 及收藏者、時間等自有資料，不呼叫 Place Details，也不擷取原生資訊窗文字。Google 原生資訊窗內容依 POI 而異，不能由 eatGoMap 直接換色、插入收藏按鈕或讀取欄位；若建立自己的 `InfoWindow` 可控制內容、標題與寬度等，但那是自訂資訊窗。已新增決策 `D004_google_native_poi_favorite.md`。此項決策於 2026-11-05 落實在底圖 POI 點擊路徑；搜尋建議選取仍使用 Place Details，收藏目前僅為頁面記憶體示意。

## 2026-11-04 eatGoMap 底圖 POI 點選與卡片關閉

啟用 Google Maps 底圖 POI 點選；Map click event 含 placeId 時呼叫 Places Place Details，阻止 Google 預設資訊窗，並載入共用地點卡片。POI 選取不再疊加第二個 marker；搜尋選取仍會顯示搜尋 Marker。卡片 × 清除選取、搜尋欄及建議，並移除搜尋暫存 Marker。Cloudflare build 72 modules 通過；本機瀏覽器以有效 Place ID 觸發 Map click event，確認卡片顯示店名／地址、搜尋欄維持空白；再點 × 確認卡片消失且搜尋欄空白。尚未部署／Commit／Push；實機點擊底圖 POI 尚待驗收。

## 2026-11-04 eatGoMap 首頁初始不選取地點

首頁 `selectedPlaceId` 初始設為空，地點卡片只在選取地圖 Marker 或搜尋結果後顯示；切換美食／旅遊篩選時若原選取地點不符合篩選，會清除選取而不自動挑選另一地點。Cloudflare build 72 modules 成功；本機瀏覽器確認 Google 地圖載入、搜尋欄存在、初始卡片隱藏。尚未部署或 Commit／Push。

## 2026-11-04 eatGoMap 搜尋選取卡片未渲染修正

使用者回報卡片未顯示並提供 Vue console error。根因是空選取時 `selectedPlaceDetail` 無保護讀取 `null.detail`，搜尋結果時卡片範本又直接從空的預設地點讀取 tone，兩者會中斷 Vue render。新增統一 `activePlace` 投影並讓空選取 computed 安全回傳；Google PinElement 改直接傳入 marker，移除 deprecated `.element` 使用。Cloudflare build 72 modules 成功；在本機瀏覽器實際搜尋「幸花雞白湯拉麵」並選取建議後，建議選單收合，地圖移至三重店，卡片顯示店名／地址與「收藏」按鈕；沒有 Vue render error 或 PinElement deprecation warning。未部署／Commit／Push。

## 2026-11-04 eatGoMap 選取搜尋建議後關閉清單並顯示卡片

選取 Places 搜尋建議時，立即清空建議清單並以建議名稱／place ID 顯示地點卡片；Place Details 回傳後補上正式名稱、地址並移動地圖。Cloudflare build 72 modules 成功；尚未送出真實 Places 查詢做端對端驗收。

## 2026-11-04 eatGoMap 搜尋結果卡片收藏／打卡切換

搜尋結果選取後，地點卡片改顯示 Google Places 的名稱與地址。新地點主要按鈕顯示「收藏」；按下後加入前端記憶體中的示意收藏，狀態提示變為「已收藏 · 尚未打卡」，主要按鈕切換為「打卡」。書籤可取消收藏並恢復「收藏」按鈕。示意收藏只存活於本次頁面執行期間，reload 會清除；實際共享收藏／打卡需待合作方 API 契約與串接完成。尚未部署、未 Commit／Push。

## 2026-11-04 eatGoMap 店家與地址搜尋

搜尋欄已串接 Google Maps JavaScript API 的 Places Autocomplete Data API；輸入至少 2 個字後顯示最多 6 個店家／地標或地址建議，使用 autocomplete session token，並以目前地圖視野作為位置偏好。選取建議會取得名稱、地址與座標，地圖移至結果並顯示搜尋標記。Places library 初始化失敗時仍保留底圖與定位。Cloudflare build 72 modules 成功；本機瀏覽器確認搜尋 placeholder、Google 地圖與手機 viewport 設定。尚未送出 Places 查詢，Google Cloud Places API (New) 啟用、帳單與真實建議流程尚未確認；未部署、未 Commit／Push。

## 2026-11-04 eatGoMap 停用頁面手勢縮放

依使用者要求，僅在 `map-home` 首頁掛載時將 viewport 設為 `maximum-scale=1, user-scalable=no`，避免手機捏合手勢放大整頁；Google Maps 地圖手勢仍由地圖本身處理。離開頁面時還原原 viewport，避免影響其他頁面。原型文件已記錄此行為與實機驗收待辦。尚未執行手機實機驗收、Build 或部署。

## 2026-11-04 eatGoMap 本機 HTTPS 開發與預設地點

依使用者要求設定可供 iPhone 同網段測試 GPS 的本機 HTTPS 開發服務。新增 `npm run dev:https`，Vite 綁定 `0.0.0.0:5174`，使用位於 `platform/frontend/.certs/`（Git 忽略）的本機伺服器憑證；本機 CA 私鑰留在 `~/Library/Application Support/eatGoMap/dev-https/`，CA 已加入 Mac 使用者 Keychain SSL 信任。伺服器目前已啟動，網址 `https://192.168.50.113:5174/`；公開 CA 憑證 `/Users/zhangyu/Downloads/eatgomap-dev-ca.cer` 需 AirDrop 到 iPhone 並安裝、啟用完整信任後才能在手機信任 HTTPS。curl TLS 憑證驗證成功，Chrome 瀏覽器 `window.isSecureContext` 為 true。Google 地圖預設中心改為台北中山區約 `{ lat: 25.0641, lng: 121.5336 }`；載入時若定位獲准仍會移至裝置實際座標。尚未部署；尚待 iPhone 安裝 CA 後實機允許定位驗收。

## 2026-11-04 eatGoMap 首次載入定位與定位圖示修正 v0.1.6

使用者要求網站載入地圖時即詢問目前位置，並指出定位按鈕圖示歪斜。已在 Google Map 初始化後自動呼叫瀏覽器 Geolocation；授權時地圖移至座標並顯示藍點，拒絕時顯示 GPS／網站位置權限提示，定位按鈕仍可重試。定位按鈕已換成對齊的 SVG 準星。Cloudflare 建置 72 modules 成功；使用載入前注入的模擬座標驗證首次載入即新增定位 marker、地圖定位完成訊息、Header/body 顏色相同及 SVG 無旋轉。Staging `v0.1.6` 已部署：Commit `b30171db2928d3714b1067d5b9c8a3fde8594112`、Tag `dep_eatgomap_v0.1.6`、Workflow `41793045701` 成功；公開 Staging 隔離瀏覽器驗收通過。

## 2026-11-04 eatGoMap 目前位置定位與 Header 背景一致性修正 v0.1.5

針對 Header 與頁面背景交界色差，原因是相同漸層在不同大小元素分開繪製；已改用共用純色 `#0d6961`。定位按鈕接入瀏覽器 Geolocation：使用者點擊並授權後取得一次座標、將 Google Map 平移至座標並顯示目前位置點；權限拒絕、定位不可用、逾時與非 HTTPS 環境均提供 GPS／瀏覽器位置權限提示。本機以模擬座標 37.7749,-122.4194 驗證地圖移動與藍點，也驗證權限拒絕訊息；背景值確認 Header、html、body 同色。Staging v0.1.5 已部署：Commit `3fc937b6211299c24c845a3af1a37ee10915c479`、Tag `dep_eatgomap_v0.1.5`、Workflow `41792429522` 成功；公開頁面確認三處背景均為 `rgb(13, 105, 97)`，Google Maps 與定位按鈕正常載入。實際 GPS 讀取須使用者點擊並允許瀏覽器定位。

## 2026-11-04 eatGoMap 手機版地圖首頁版面調整

依使用者提供的 iPhone 畫面完成調整：底部導覽列固定 56px；Header 精簡為左側單獨 Logo、右側搜尋框，移除中英文標題與兩個使用者圖示，篩選列保留。手機版頁面、`html` 與 `body` 背景使用 Header 相同的深綠漸層。`VITE_PROJECT=eatGoMap npm run build:cloudflare -- --outDir /tmp/eatgomap-header-compact-check` 成功（72 modules）。Staging v0.1.4 已部署：Commit `ce6d5756409a3f27e561432f62a2cac5b8bffd18`、Tag `dep_eatgomap_v0.1.4`、Workflow `41791094205` 成功；瀏覽器確認 Logo、搜尋框同列，標題／使用者按鈕移除、Google Maps 載入、導覽列 56px，頁面 Smoke 通過。

## 2026-11-04 eatGoMap Staging Logo 重新整理 v0.1.3

使用者將網站加入主畫面後，希望可由左上角 Logo 主動重新載入，取得最新部署版本。品牌圖示與標題已改為按鈕，點擊執行 `window.location.reload()`。Staging `v0.1.3` 已以 Commit `4072a74c6f9cdd64e36cc179e737e893c91c6010`、Tag `dep_eatgomap_v0.1.3` 部署成功；GitHub Actions Workflow `41787400517` 完成，建置 72 modules、API transport、Worker 測試及 Staging Smoke 通過。已在公開瀏覽器點擊 Logo，確認瀏覽器導覽類型為 `reload`，重新載入後 Google Maps 仍正常 (`window.google.maps` 存在、`.gm-style` 節點 1 個)。

## 2026-11-04 eatGoMap Google Maps 原型與 Staging v0.1.2

首頁已整合 Google Maps JavaScript API、難波底圖與五個合成 Advanced Marker；搜尋框調為 40px。Staging v0.1.2 已部署至 `https://eatgomap-staging.takoson68.workers.dev`：Commit `bcab258c79c4abe38e3df0c44be67ab5639a8332`、Tag `dep_eatgomap_v0.1.2`、Workflow `41786674646` 成功，已在公開瀏覽器確認 `window.google.maps` 與 `.gm-style` 地圖節點存在，頁面顯示 Google 地圖資料與難波底圖。Google Key 由 GitHub `staging` Environment Secret 注入 eatGoMap 建置，不寫入 Git；前端 Key 可由瀏覽器取得。依使用者決定，最終網域尚未確定，Google Cloud 網域/API 限制稍後再設定。建置、API transport、Worker 測試、Wrangler dry-run 與 Staging 部署流程均通過；地點仍為合成標記，後端功能尚未串接。

## 2026-11-04 eatGoMap Staging 部署設定與首次草圖發布

使用者要求將 `eatGoMap` 部署至 Staging 供檢視草圖，並授權新增部署設定。新增靜態 Worker 目標 `eatgomap-staging`（`https://eatgomap-staging.takoson68.workers.dev`）、手動 workflow 選項與 `dep_eatgomap_vX.Y.Z` Tag 白名單。本次版本 `0.1.0` 已於 Commit `d1f1d8d0ad815f44c555edd602d3c533280585b5` 部署，Tag 為 `dep_eatgomap_v0.1.0`，GitHub Actions Workflow `41781429189` 成功；首頁與 `/version-check` 均回 HTTP 200 並含 `id="app"`，GitHub Release 已保存 ZIP、manifest、checksum。前端建置 71 modules、API token transport 3/3、Worker 78/78、Wrangler dry-run 與 Release ZIP 封裝均通過。目標不綁 D1、不呼叫合作方 API，僅包含合成資料首頁。版本控制台白名單未擴充，因此此 Project 不會出現在版本控制台。

## 2026-11-04 eatGoMap 地圖首頁視覺原型

依使用者要求，`eatGoMap` 已從純文件骨架推進為可載入的地圖首頁視覺原型。新增 `map-home` Module、`/` 公開路由、Project LayoutRoot 與全域樣式入口；畫面沿用草稿的暖白／深綠色系、搜尋列、美食／旅遊與距離篩選、難波靜態地圖質感、合成 Marker、地點卡片及地圖／收藏／日誌底部導覽。分類、距離及 Marker 可做本機 UI 互動；所有地點與狀態都是合成假資料，未串 Google Maps、定位、後端 API、照片服務或正式身分。後續先由使用者檢視首頁視覺與資訊層級，再決定是否調整定稿；不得將此畫面視為地圖或 API 功能完成。

## 2026-11-04 eatGoMap Project 文件與草稿備份完成

依使用者要求建立 `platform/frontend/projects/eatGoMap/` 文件型 Project 骨架，暫定名稱 `eatGoMap`、顯示名稱「食旅共享地圖與日誌」。已建立 `project.config.js`、Project `index.md`、`PROJECT_CONTEXT.md`、`docs/`、`decisions/`，並以純文件入口保留 `layout/`、`modules/`、`styles/`；沒有建立 Vue 頁面、路由、模組註冊或 API 程式。HackMD 初步需求已另存 2026-11-04 Markdown 原文快照，整理後的介面架構、前後端外部 API 邊界、兩人私人使用與身分延後決策亦已收斂到 Project 文件；原始 PNG 另備份至 `docs/assets/`。前後端維持獨立 Repository、另設共用契約 Repository 的構想已記錄為 `proposed`，尚未與後端確認，因此未建立遠端 Repository、Submodule 或其他 Git 連線。`platform/frontend/projects/index.md` 已登錄此 Project，並明確標示目前不可載入。後續先與後端確認共用文件工作流，再決定是否採用 `eatGoMap-contracts` 與引用方式；開始實作前另需確認第一個里程碑與正式 API 契約討論範圍。

## 2026-10-29 工作區索引直接維護未完成清單

依使用者要求，`_workspace/index.md` 現在直接列出精簡未完成事項及詳情連結，避免每次恢復工作都展開大量文件。清單目前包含 ChatCore M4a（先檢視 M4 結果、等使用者決定）及 M1b 跨實體網路／TURN 成本驗證；M1b 不阻擋 M4 Gate。`_ai-context/紀錄管理規則.md` 已明定 index 摘要與 `CURRENT_WORK.md` 最新停止點需同步維護；`_workspace/_reports/index.md` 的 chatCore 尚未建立描述已更新。相對 Markdown 連結檢查通過，未改程式碼、未 Commit／Push。後續先讀 `_workspace/index.md`，再只開啟使用者選定待辦的詳情。

## 2026-10-29 chatCore M4 身分與房間 Ticket 實驗

依使用者「下一步」完成執行書 M4。ChatCore 專屬 Worker 代驗 dineCore 帳密、立即撤銷上游 dineCore Bearer，並為 `CHATCORE_MEMBER_USERNAMES` 名單內會員簽發 30 分鐘 chatCore scope Session；前端沿用既有 auth/token store。Ticket 綁定會員、tenant、deviceId、roomId，60 秒且只可使用一次。WebSocket 僅接受 Ticket；peerId 由 Worker 產生，同房轉送 Signaling。每房限制 20 個不同會員與 20 個在線裝置，同帳號多裝置可有獨立 peerId。M4 暫用全域合成實驗名單作 cohort membership，尚無逐房成員管理，留待 M4a。

合成 Worker Auth Service 自動測試 4/4 通過，涵蓋 Project 標頭、跨 tenant Bearer 拒絕、會員 allowlist、Session 映射／登出撤銷、Ticket replay、同房轉送、跨房目標拒絕、匿名 WS 拒絕與第 21 裝置拒絕。完整 Worker suite 78/78，ChatCore Cloudflare build 82 modules，Wrangler deploy dry-run 通過。已建立 dineCore Staging 合成測試會員 `admin1`、`admin2`、`admin3`（一般 member），並驗證其登入／登出。以本機 Miniflare 和臨時本機 secret 經真實 Staging Auth Service 完成本機整合；另對已部署 ChatCore Staging 實測登入、Session 還原、Ticket、WebSocket 入房及登出撤銷，全部通過，並在 `/console` UI 成功登入後登出。`dep_chatcore_v0.1.6`／Commit `454e38d`、Workflow `40847827037` 成功，含 Worker 全量測試、靜態頁、匿名 Ticket smoke、Release 與 Deployment 紀錄。`v0.1.5` 曾部署但 Workflow 卡在 smoke 腳本未釋放拒絕 response，已取消其 run；修正後 v0.1.6 完整通過。M4 Gate 通過，結果見 `platform/frontend/projects/chatCore/docs/M4_RESULT.md`。M1b 跨實體網路／TURN 成本仍待驗證；M4a 未開始，等使用者檢討決定。

測試會員是 dineCore Staging 的一般 member 帳號，使用者表示實驗結束時若需清除可再清理，目前保留以供後續實驗使用。此里程碑已部署並完成 M4 Gate；先檢討 M4 結果，再依使用者決定是否開始 M4a。沒有進行跨實體網路／TURN 成本測量，該項保留給 M1b 實驗。

## 2026-10-29 chatCore M3 Gate 通過，等待檢討

依使用者「下一步」指示，完成執行書 M3：Private Chat Lab DataChannel 使用 `chatCore.v1` envelope 與穩定 `messageId`；收件端在解析後回 received、IndexedDB 寫入／確認成功後回 persisted；重複 ID 不重複保存。發送端逐本次目標 Peer 投影 received／persisted／READ，所有目標 Peer persisted 才移除本機 outbox。10 秒未確認標逾時並保留手動重試；重試沿用同一 ID。READ 僅在頁面前景、聊天室區域實際可見、訊息 IntersectionObserver 可視至少 60% 且已保存時寫入本機並發送。

實驗中加上 256 KiB DataChannel bufferedAmount 上限；高於上限拒送並保留 outbox，不做流量排程。M3 不含伺服器 queue、離線 Peer 保證、跨裝置 history/read 同步、會員授權或 E2E。實作限制在 chatCore 模組；新增 repository/read policy 測試與 `docs/M3_RESULT.md`。

驗證：Cloudflare build 82 modules；Private Chat Lab 3/3、既有前端 Chat runtime 8/8 通過。兩個本機瀏覽器環境成功傳輸 10 則合成文字；僅可視訊息發出 READ，訊息捲入可視區後才補 READ。暫時注入接收端 IDB unavailable，觀察到 received 1/1、persisted 0/1、10 秒逾時及 outbox 保留；恢復 IDB 後沿用同 ID 重試，收件端保存並回 persisted，注入碼已移除。未以瀏覽器故意丟 ACK；ACK 重複冪等由資料層測試覆蓋。未部署、未 Commit／Push、未改 Worker／公開聊天室。

結果記於 `platform/frontend/projects/chatCore/docs/M3_RESULT.md`。M3 Gate 通過；先由使用者檢討，再決定是否進 M4。M1b 跨實體網路與 TURN 成功率／成本仍待驗證。

## 2026-10-29 chatCore M2 Gate 通過，等待檢討

依使用者「從執行書下一步開始」指示，完成 M2 IndexedDB 本機 history/outbox。檢查 `world.services.storage()` 發現其 IDB 失敗會靜默降級 memory，模組無法確認持久化，因此依執行書新增模組私有薄型 repository，未修改平台核心。發送訊息與 outbox 原子寫入後才交給 DataChannel；接收訊息 IDB 保存成功後才標示已保存。DataChannel 接受不作為 delivered/persisted 證明；因 M3 ACK 尚未存在，未確認 outbox 保留並可手動重試，UI 明示重試可能造成重複。

同時完成前述 chatCore UI 待辦：外層與內層捲軸統一；左側最近房間清單保留 30 項；點擊切入並連線；網址／欄位有房間代碼時以「加入聊天室」為藍色主按鈕。房間目錄只存 localStorage；訊息與 outbox 存 IndexedDB；兩者都不跨裝置同步。當前仍是最多五人通用實驗房間，未區分一對一／群組類型。

驗證：Cloudflare build 81 modules；前端 Chat runtime 8/8、Worker 77/77；本機 Worker + Chrome 與 In-App Browser 兩個隔離瀏覽器環境建立 DataChannel，傳送／接收、重載 history/outbox、未確認 outbox 重試均已人工驗證。測試注入 IndexedDB 不可用時 UI 顯示儲存錯誤，發送端未送出資料。未部署、未 Commit／Push。M1b 跨實體網路與 TURN 仍待驗證；M2 不代表 M3 ACK Gate 通過。

結果記於 `platform/frontend/projects/chatCore/docs/M2_RESULT.md`。下一步先由使用者檢討 M2，再決定是否開始 M3；不得把 DataChannel send 成功標成收件端已保存。

## 2026-10-29 最新續作：chatCore 參考 Gemini UI 細節調整

使用者提供 Gemini UI 分享連結作為細節參考。依參考畫面調整時保留實際程式資料，不沿用畫面中的虛構 Peer 名稱、18ms 延遲、封包遺失率或示範訊息。修正專注聊天模式原本缺少房間控制的可用性問題：未連線時可直接在專注模式建立新聊天室或輸入房間代碼加入；整合模式繼續使用實驗卡內的房間控制。同步細修：版號仍顯示建置值、改為通道傳輸加密說明並標明非 E2E、修正多人聊天室名稱、通道名依實作顯示 `chat-text`、移除固定百分比的虛假流量條、傳輸狀態分開呈現 Partial／Connecting。

驗證：`VITE_PROJECT=chatCore VITE_RELEASE_VERSION=0.1.2 npm run build:cloudflare -- --outDir /tmp/chatcore-ui-refine-check` 成功（80 modules）；`git diff --check` 通過。本機 `/console` 瀏覽器已切換兩種模式，確認專注模式顯示建立／加入控制，填入代碼後加入按鈕啟用。這輪尚未部署；`dep_chatcore_v0.1.2` Staging 仍為前一版 UI。

再依使用者意見將整合／訊息區原生捲軸改為深色細捲軸（Firefox 與 WebKit 樣式）；瀏覽器確認捲軸寬 8px、軌道為深色，視覺不再出現白色粗條。Build 與 diff check 通過，未部署。

唯一下一步：由使用者檢視本機細節調整，再決定是否部署下一個 Staging patch 版。


## 2026-10-29 最新續作：chatCore 聊天實驗頁雙模式 UI

依使用者最新確認，沒有登入／角色機制時，整合視圖與專注聊天兩種模式都開放給測試者使用；兩者共用同一聊天室連線，整合視圖不代表管理員權限。`modules/private-chat-lab/pages/index.vue` 已改為深色三欄整合視圖及可切換的專注聊天版面，整合模式包含 Project 導覽、能力卡、房間控制、實際 Peer/ICE 狀態與右側聊天；聊天可建立／加入房間、複製邀請連結及以 Enter 傳送合成文字。未加入會員角色、歷史持久化或檔案傳送。`runtime.js` 的參與者摘要包含本機 Peer ID。Project 索引、Context、設定能力名稱及入口文案已對齊雙模式決策。

驗證：明確設定 `VITE_PROJECT=chatCore` 後 staging build 成功（80 modules）；`git diff --check` 通過；本機 `/console` Accessibility tree 確認雙模式切換、整合視圖元件與聊天室控制可載入。第一次未指定 Project 的 staging build 使用現有 `.env` 建置 dineCore，未作為 chatCore 驗證。之後依「部署」指示發布 `dep_chatcore_v0.1.2`（Commit `5323f9a`）；Workflow 40834185811 通過 Worker／Static Assets 部署、SPA smoke 與五人 Signaling smoke。線上頁首 `v0.1.2` 及兩種模式切換已由瀏覽器確認。

唯一下一步：在本次 Staging 版以多瀏覽器驗證五人 RTCDataChannel Full Mesh，尤其是跨裝置／網路、訊息廣播及單一 Peer 離線後的恢復；Signaling Workflow smoke 不代表已完成該項 P2P 驗收。結果記於 `platform/frontend/projects/chatCore/docs/M1B_RESULT.md`。


## 2026-10-29 最新停止點：chatCore P2P M0a Gate 通過，等待使用者檢討

依使用者連續「下一步」指示，完成 M0a：建立獨立 `platform/frontend/projects/chatCore/`，提供 `/` 實驗入口與 `/console` 控制台，經 Project 自有 `modules/index.js` 註冊路由。控制台列出會員管理、聊天室管理、一對一私人連線三項尚未開放能力；Game Demo Staging 連結由本地設定登錄並另開分頁，不攜帶 token／ticket。Project 文件、里程碑計畫及 M0 結果已由 `docs/index.md` 導讀，工作區報告目錄保留存檔。結果見 `platform/frontend/projects/chatCore/docs/M0A_RESULT.md`。

`VITE_PROJECT=chatCore` Cloudflare build 成功，產物位於 `/tmp/moducore-chatcore-m0a`；瀏覽器直接載入入口與控制台深層路由成功。另以本機瀏覽器檢視 dineCore 桌邊入口與 game-demo 遊戲／公開聊天室入口，均可載入。未修改平台 Router／Container、其他 Project 或公開聊天室；未執行測試套件、未部署。

唯一下一步：由使用者檢討 M0a 的 Project 定位、控制台資訊及連結方式，再決定是否進入 M1（兩個瀏覽器建立 RTCDataChannel）。不得自動進入 M1。

## 2026-10-29 前次停止點：chatCore P2P M0 首次 Gate 未通過

已依 `P2P_CHAT_MILESTONES.md` 執行 M0，結果見 `_workspace/_reports/2026-10-29_chatcore_p2p_plan/M0_RESULT.md`。獨立 chatCore Project／tenant、dineCore 作過渡期外部身分來源、chatCore-scoped Auth 轉接與私人 Chat namespace 已形成可測試候選方案；未建立 Project 或產品程式。前端 Chat 8/8、公開 Chat 契約 4/4、Worker 公開 Chat 8/8、Auth 13/13 本機通過。game-demo Staging 公開聊天室送出合成訊息後當頁可見，但重整及另一分頁沒有歷史回放；dineCore Staging 桌邊點餐入口可見。此差異已記錄 `ISSUE-20261029-001`；唯讀部署紀錄顯示 active Chat Worker 版本早於本機歷史持久化 commit，為最有力解釋，線上新版尚未驗證。M0 Gate 判定 failed，依階段規則未進 M0a；未修改產品程式、安裝套件、部署或寫入會員資料。

唯一下一步：若使用者決定另行發布本機已驗證的 Chat Worker 至 Staging，需依部署流程執行並重做 M0 手動 Gate；通過後先檢討結果，再決定是否進 M0a。M0 本身不包含部署，不得將本機測試通過當作線上歷史驗收通過。

## 2026-10-29 前次停止點：chatCore 獨立 Project 定位確認（當時尚未建立頁面、未啟動 M0）

已依使用者確認的 11 項決策建立 `_workspace/_reports/2026-10-29_chatcore_p2p_plan/P2P_CHAT_MILESTONES.md`，定位為獨立 chatCore Project 的漸進式技術實驗。原先誤置於 dineCore `docs/` 的文件已移出；dineCore 僅為第一階段身分來源，chatCore 的 Project／tenant 授權邊界須在 M0 確認。文件定義 M0～M9：公開聊天室隔離、2 Peer DataChannel、IndexedDB history/outbox、received／persisted／READ、正式 Session／ticket／ACL、7 天逐收件者離線 queue、5 裝置 Full Mesh、PWA 前景／背景、10／20 裝置成本壓測與 7 天備份提醒。已明定不做跨裝置歷史同步、任一裝置 persisted 即完成 user-scope delivery、WebSocket 採前景活動與背景重連實驗、第一階段只使用合成明文，且不修改平台核心或既有公開聊天室。

本輪修正規劃文件歸屬與索引，並依使用者要求新增 M0a：chatCore 專屬進入頁面、控制台與日後 Project 連結區。M0a 要求獨立 `VITE_PROJECT` 載入、由 Project 模組註冊路由、以本地設定登錄受控連結、目標 Project 自行驗證身分。後續需求補入 M4a（聊天室與既有會員管理）、M4b（一對一邀請／私人連線）、M10（獨立共用會員身分及 Project 授權邊界）、M11（控制台新增共用會員）。現有 Worker 帳號與 Session 以 tenant 分隔且沒有一般會員建立 API；dineCore 會員僅作過渡實驗來源，不預先透過 chatCore 新增 dineCore 帳號。尚未建立 chatCore Project 頁面、未修改產品程式碼、未安裝套件、未執行測試或部署。所有新里程碑尚未開始。

唯一下一步：由使用者另行明確指定是否開始 chatCore Project 建立或 M0；未取得指令前不得自動進入實作。

## 2026-10-27 續作停止點：scale-hardening 報告結案（暫不部署）

使用者確認 `_workspace/_reports/2026-10-27_platform_chat_scale_hardening/` 報告到此為止，暫不部署到 Staging 驗證。M1（前端排序效能）、M2（DO 內建 SQLite 歷史持久化）、M3（WebSocket Hibernation）均已完成並通過本機測試，報告狀態已標記 `done`（本機範圍）。未 Commit／Push／部署，`wrangler.chat-poc.jsonc` 未修改。`_workspace/PLATFORM_CHAT_EXECUTION_MILESTONES.md` 的 M6 是否正式啟動、M4／M5 的手機與跨房間隔離人工驗收，均未另外處理。

唯一下一步：無待辦；下一步工作項目由使用者另外提出。

## 2026-10-27 續作停止點：scale-hardening M3（WebSocket Hibernation）完成

`PublicChat` Durable Object 改用 Hibernatable WebSockets：`server.accept()` + `addEventListener` 改為 `state.acceptWebSocket(server)` + `webSocketMessage`／`webSocketClose`／`webSocketError`；連線中繼資料改用 `serializeAttachment`／`deserializeAttachment` 存活於 hibernation 之間，`this.connections` Map 移除改以 `state.getWebSockets()` 為唯一連線來源；每連線一個 `setTimeout` 的 idle 斷線改為單一 DO `alarm()`（`setTimeout` 在 DO hibernate 後會遺失，`alarm` 由 storage 持久排程不會）；`playerSequence` 改存入 `state.storage`，避免 hibernate／回收後重新從 0 計數與既有連線的 `playerNumber` 衝突。

新增兩項測試：idle timeout 由 alarm 驅動正確關閉閒置連線、不影響仍活躍連線（驗證時改為輪詢 DO 內部連線數，而非依賴 ws client 端 `close` 事件到達時機，因實測後者明顯落後於 DO 內部狀態）。`chat-poc.test.mjs` 8/8、Worker 全量測試 74/74 通過，重跑 3 次無 flaky。

**未能驗證的項目**：Miniflare 5.x 未提供強制觸發 DO 記憶體回收／喚醒的測試 API，因此「DO 被真正 hibernate 後再喚醒，既有連線 attachment 不遺失」只驗證了讀寫邏輯正確，未能在本機獨立複測真實 hibernate-wake 週期；這是 Cloudflare Hibernation API 自身的文件保證，但本輪沒有獨立證據。另外 `processedRequests`（請求去重 Map）仍只存在記憶體，跨 hibernate 可能遺失，為已知殘留風險（已記錄於 scale-hardening 報告，機率低、前端有 `messageId` 去重擋住重複顯示）。

未 Commit／Push／部署，`wrangler.chat-poc.jsonc` 未修改。`_workspace/_reports/2026-10-27_platform_chat_scale_hardening/EXECUTION_PLAN.md` 的 M1／M2／M3 均已完成。

唯一下一步：使用者決定是否授權部署到 Staging 驗證真實 Hibernation 行為，或是否正式啟動 `PLATFORM_CHAT_EXECUTION_MILESTONES.md` 的 M6。

## 2026-10-27 續作停止點：PLATFORM_CHAT_EXECUTION_MILESTONES.md M1 殘留 Gate 補齊

依使用者要求補齊 M1 剩餘兩項 Gate：
1. **連線關閉後不殘留可觀察的連線與計時器**：在 `PublicChat.fetch` 新增內部除錯分支（`X-Chat-Internal: 1` + `/internal/connections`），僅能透過持有 `PUBLIC_CHAT` DO binding 的呼叫方存取，未經過公開 Worker 路由，不對外部網路暴露；`chat-poc.test.mjs` 新增測試驗證連線關閉後 `connections.size` 正確遞減至 0。
2. **Staging smoke test 通過**：查證既有 Commit `346d843`（`docs(platform-chat): record staging verification`）與 `CURRENT_WORK.md` 歷史紀錄，確認 `dep_platform-chat_v0.1.3`／Commit `0b2d391` 已於 Staging 完成兩個遠端 WebSocket 客戶端廣播 smoke，Release 與 verified deployment state 已建立；本次只是把既有證據補上 Gate 勾選，未重新部署或重跑遠端 smoke。

`chat-poc.test.mjs` 7/7、Worker 全量測試 73/73 通過。`PLATFORM_CHAT_EXECUTION_MILESTONES.md` 的 M1 已全數勾選並更新總覽表格與第 12 節為「M0/M1/M2/M3 完成，M4/M5 進行中，M6/M7 未開始」。M1 全數 Gate 通過後，規則上已可啟動 M6，但是否正式宣告 M6 開始由使用者決定；本次未宣告 M6 開始，也未 Commit／Push／部署。

唯一下一步：使用者決定是否正式啟動 M6，或繼續執行 `_workspace/_reports/2026-10-27_platform_chat_scale_hardening/EXECUTION_PLAN.md` 的 M3（WebSocket Hibernation）。

## 2026-10-27 最新停止點：Platform Chat 里程碑狀態校正 + 效能／快取硬化 M1／M2 完成

`_workspace/PLATFORM_CHAT_EXECUTION_MILESTONES.md` 的總覽表格與原第 12 節「當前停止點」長期停留在下方「M1 完成，下一步進入 Staging smoke」的舊狀態，但 M2～M5 各節自己的 Gate／結果早已記錄大量完成項目，且與實際原始碼（`platform/frontend/src/chat/*`、`platform/worker/src/chat-poc.js`、`magic-siege`／`game-demo` 的 chat opt-in 設定、dineCore `chat-admin` 模組）及本機 `git tag dep_platform-chat_v0.1.0~v0.1.10`、數十筆 `platform-chat` commit 一致。已校正該文件總覽表格與第 12 節為：M0／M2／M3 完成，M1／M4／M5 進行中（各自殘留項目已列出），M6／M7 未開始。

另依使用者要求，針對「效能、資料變多後暫存快取、DOM 節點過多」三個問題建立獨立執行書 `_workspace/_reports/2026-10-27_platform_chat_scale_hardening/EXECUTION_PLAN.md`，完成其中 M1（前端 `MessageStore` 排序效能優化、新增 `addMessages` 批次合併）與 M2（`PublicChat` Durable Object 改用自帶 SQLite storage 保存最近 50 筆訊息並在新連線回放 `chat.history`）。前端 `test:chat` 8/8、Worker `chat-poc.test.mjs` 6/6、Worker 全量測試 72/72 通過。未 Commit／Push／部署；未宣告 `PLATFORM_CHAT_EXECUTION_MILESTONES.md` 的 M6 已開始（該文件規定 M6 需等 M1 殘留 Gate 通過才能開始）。

唯一下一步：使用者決定是否補齊 M1 殘留 Gate（連線清理驗證、Staging smoke test）以正式解鎖 M6，或繼續執行 scale-hardening 報告的 M3（WebSocket Hibernation，風險較高、與 M1 殘留 Gate 直接相關，尚未開始）。

## 2026-10-27 最新停止點：Platform Chat M1 本機 Proof of Concept 完成

M1 已建立隔離的 `platform/worker/src/chat-poc.js`、`PublicChat` Durable Object、`wrangler.chat-poc.jsonc` 與 4 項 WebSocket／廣播／錯誤／房間隔離測試。`node --test test/chat-poc.test.mjs` 4/4 通過，Wrangler dry-run 通過；未接入 `magic-siege`、未建立 Chat UI、未修改既有 Worker route、未安裝套件、未 Commit／Push／部署。Node.js 長駐 WebSocket 僅完成比較，未另建伺服器。

唯一下一步：取得明確部署授權後，將隔離 Chat PoC 部署至 Staging 執行 smoke test；Staging Gate 通過前不進入 M2。

## 2026-10-27 最新停止點：Platform Chat M0 完成

已依 `PLATFORM_CHAT_EXECUTION_MILESTONES.md` 完成 M0 平台邊界與契約凍結。Chat 明確定位為平台能力；`chat.js` 僅作組合與生命週期協調者，底層重用原始 `Container` 實例，不依賴 `magic-siege`。新增 `platform/chat-contract/index.js`、索引與 4 項執行期驗證測試；測試 4/4 通過，`git diff --check` 通過。未建立 WebSocket route、Durable Object、Chat UI，未安裝套件、未 Commit／Push／部署。

唯一下一步：執行 M1，先比較並驗證候選 WebSocket 後端與目前 Cloudflare 部署條件，再決定正式 transport 方案；第一階段不加入聊天歷史資料庫。

## 2026-10-23 最新停止點：第二關地圖規格建立

已建立 `magic-siege/docs/LEVEL_2_MAP_DESIGN.md`，定義第二關的 14×9 雙折回路線、障礙布局、布防節奏與完成 Gate。第二關先沿用現有塔、敵人與十波系統，避免與新關卡同時擴張新塔種或 Meta。

唯一下一步：將第二關路線與障礙資料接入關卡切換，讓第一關勝利後可進入第二關準備階段。

## 2026-10-23 最新停止點：M5 十波勝利人工驗收完成

使用者已在本機瀏覽器完成第 1 波至第 10 波人工長局，確認第 10 波結束會正確跳出勝利畫面。十波核心自動測試、加速功能與最小循環均已完成；目前剩餘主要是實機觸控及分頁／輸入邊界的最終驗收。

唯一下一步：完成實機觸控與分頁／輸入邊界驗收，再決定是否將 M5 整體標記完成。

## 2026-10-23 最新停止點：M5 HUD 金幣與加速按鈕遮擋修正

發現加速按鈕與金幣 HUD 原本同處右上區域，會遮住金幣數值；已將金幣圖示／標籤／數值往左移，為 1×／2×／4× 速度按鈕與暫停按鈕保留獨立空間。`magic-siege` Build 與 `git diff --check` 通過。

唯一下一步：重新整理瀏覽器確認右上 HUD 實際視覺間距。

## 2026-10-23 最新停止點：M5 加速後最小人工循環完成

本機瀏覽器完成「建塔 → 開始第 1 波 → 切換 2×／4× → 進入第 2 波準備 → 查看上一波結算 → 重新開始」循環。人工畫面確認第 2 波準備、上一波結算、生命／金幣延續；重開後回到第 1 波、生命 20、金幣 100 並清除塔與結算。

唯一下一步：若繼續 M5，進行完整十波瀏覽器長局；核心自動化十波與目前最小人工循環均已完成。

## 2026-10-23 最新停止點：M5 戰鬥加速功能完成

右上角新增 1×／2×／4× 戰鬥速度按鈕，僅放大戰鬥模擬時間；準備、結算與暫停不會自行推進。simulation 已補 speed 狀態與切換驗證，專屬測試目前 10/10 通過，`magic-siege` Build 與 diff check 通過。

唯一下一步：在瀏覽器完成第 1 至第 10 波人工長局，並確認 2×／4× 加速與暫停互動。

## 2026-10-23 最新停止點：M5 核心十波長局自動驗證完成

新增 battlefield simulation 的固定布防長局測試：八座固定位置的 Lv.3 魔法塔可完整通過第 1 至第 10 波，未進入失敗並正確進入勝利結局；專屬測試目前 9/9 通過。這證明戰鬥核心的十波最小閉環可重現，但不等於瀏覽器人工 UX 長局已完成。

唯一下一步：在本機瀏覽器完成第 1 至第 10 波人工長局，記錄每波布防、生命、金幣與結局，再決定是否宣告 M5 Gate 通過。

## 2026-10-23 最新停止點：M5 觸控與地圖外輸入人工確認

本機瀏覽器以指標觸控路徑實際操作建塔與選取，並點擊地圖外；面板顯示「未選取」與取消提示，未發生沿用舊選取消費。這只證明觸控與輸入邊界路徑可用，不等於完整十波人工長局通過。

本輪嘗試等待第一波完整結束時瀏覽器觀察逾時，未作為驗收通過證據。

唯一下一步：以較短的波次驗證流程補完第 1 波至第 10 波的人工長局，記錄每波布防、生命、金幣與結局。

## 2026-10-23 最新停止點：攻破魔法城 M5-A 最小閉環企劃完成

已依 `magic-siege` 專案決策研究 `Infinitode 2` 官方介紹、官方商店資料與官方更新說明，並與現有企劃及實作比對。企劃書已升為 v1.2，將 MVP 最小閉環定義為「波前讀取 → 布防決策 → 戰鬥執行 → 波後回饋 → 下一波調整」；M5 拆出當前小階段 M5-A，範圍限定為下波敵人預覽、單波結算快照、每塔累計傷害／擊殺。多塔種、塔經驗、提前呼叫波次、倍速、採礦、研究樹與地圖編輯器明確排除。

本輪只修改 `magic-siege` 企劃／里程碑／進度文件與本停止點，未修改遊戲程式、未 Commit／Push／部署。唯一下一步：實作 M5-A，先補下一波預覽、單波結算與塔貢獻統計，完成專屬測試、Build、`test:game` 與第 1 → 第 2 波人工閉環驗收。

## 2026-10-23 續作停止點：M5-A 實作與自動驗證完成

M5-A 已實作於 `magic-siege/modules/battlefield`：store 新增本波快照與上一波結算；simulation 追蹤波次擊殺／突破／金幣／生命變化，以及每座塔實際命中傷害與擊殺歸屬；sketch 新增下波小怪／大怪預覽、威脅提示、上一波結算與塔貢獻資訊。未新增塔種、Meta、倍速或平台能力。

驗證：battlefield simulation 8/8、`VITE_PROJECT=magic-siege npm run build`、平台 `npm run test:game` 8/8 通過。Build 僅有既有 Rollup 註解與 bundle size 警告。人工瀏覽器驗收尚未完成，未宣告 M5-A Gate 通過。

唯一下一步：以 `VITE_PROJECT=magic-siege npm run dev` 進行第 1 波至第 2 波人工驗收，確認預覽、波後結算、塔統計與重開清除，再進入觸控、分頁暫停與完整十波試玩。

## 2026-10-23 續作停止點：M5-A 人工驗收完成

本機 dev 人工驗收通過：建塔、開始第 1 波、進入第 2 波準備；画面顯示下波預覽、上波結算與塔傷害／擊殺統計；重開後回到生命 20、金幣 100、第 1 波並清除塔與統計。M5-A Gate 通過。

唯一下一步：開始 M5 下一小階段：觸控、分頁暫停、輸入邊界與完整十波人工試玩。

## 2026-10-23 續作停止點：M5 分頁暫停完成

`magic-siege/modules/battlefield/pages/index.vue` 已加入 `visibilitychange` 處理：分頁離開時僅在 Game 處於 running 戰鬥狀態自動暫停，回到頁面後恢復；準備階段不會被誤判為暫停。

驗證：`VITE_PROJECT=magic-siege npm run build`、battlefield simulation 8/8、平台 `npm run test:game` 8/8、`git diff --check` 通過。Build 仍有既有 Rollup 註解與 bundle size 警告。分頁切換的實際瀏覽器驗收尚未完成。

唯一下一步：驗證觸控、地圖外輸入邊界與完整十波人工試玩。

## 2026-10-23 續作停止點：M5 輸入邊界完成

`magic-siege` 已補強地圖外輸入：點擊地圖外會取消格子選取並顯示提示，不會沿用舊選取觸發建塔、升級或拆除；模擬層也拒絕無選取的建造。p5 現有 `pointerdown` 對觸控使用統一指標座標轉換，不另增加平台觸控層。

驗證：battlefield simulation 8/8、`VITE_PROJECT=magic-siege npm run build`、平台 `npm run test:game` 8/8、`git diff --check` 通過。

唯一下一步：完成觸控人工驗收與完整十波人工長局。

## 2026-10-22 最新停止點：AI 文件入口與專案知識路由整理

已整理根目錄 `AGENTS.md` 為 Repository 快速入口與關鍵字路由；新增 `platform/`、前端、Project Registry、舊 PHP、Worker、Release Console、效能、Project docs 與 Workspace 主題索引。`_ai-context/index.md` 改為最小初始化集合與按需路由；原 `_ai-context/_index.md`、`_workspace/_index.md` 已正名為標準 `index.md` 並更新引用。`AI_PROJECT_ENTRY.md` 修正 Project 清單、既有文件例外與 Worker 移植現況。`GEMINI.md` 收斂為轉址入口，啟動聲明不再要求先回覆固定口令；舊 DineCore PHP/MySQL Skills 和破壞性 MySQL 範例已標明適用範圍，避免與 Worker/D1 混用。根目錄架構報告移至 `_workspace/_reports/`。此前「我要部署」Staging Tag 路由仍保留，並連到正式流程和操作手冊。

驗證：新增／修改導讀文件的相對 Markdown 連結逐一解析通過；索引盤點已覆蓋治理／AI／Workspace／平台／Project docs 主要入口，`git diff --check` 通過。生成物 `.wrangler-dist/` 不增加手寫索引；未 Commit／Push／部署，工作樹其他既有修改均保留。

目前下一步：使用者可依 `AGENTS.md` 任務路由指定任一知識領域；若擴大到所有歷史治理子目錄，先從各上層 `index.md` 逐區審核，不全量移動或覆蓋文件。若使用者之後說「我要部署」，依已整理路由進入 Staging 發布流程。

## 目前階段

### 2026-10-22 最新停止點：Tag 防重用閘門與 Staging v0.1.4 驗收完成

管理頁已成功部署 verified Release 並回退 previous；新 Tag `dep_game-demo_v0.1.2`、`v0.1.3` 均成功自動部署，畫面版本膠囊已驗證與 Tag 一致。證據及 Run／Cloudflare Version 見 `_workspace/_reports/2026-10-21_tag_release_version_console/EXECUTION_PLAN.md`。

本輪新增部署前閘門：一般 Tag 更新拒絕；若同名 Release 已存在或 GitHub API 無法確認 Release 狀態則 fail-closed。Commit `f14f6546a3787d4faaa5b2a354f8ab15905b149d` 已 Push；Worker 測試 66/66、Wrangler dry-run、YAML 語法與 diff check 通過。全新 Tag `dep_game-demo_v0.1.4` 的 Run `39718382703` 成功，閘門步驟通過、Release 三資產建立、遊戲 Smoke 通過，fresh browser 顯示 `v0.1.4`。一般分支 Push 仍不會部署。管理員若同時刪除 Tag 與 Release 後重建，仍可繞過 GitHub 既有紀錄，需靠 Repository 管理權限／Tag ruleset 管控。

下一步：自動部署步驟手冊已建立於 `_workspace/範本/自動部署指令使用步驟手冊.md`。目前 Tag 部署與管理頁切版目標已驗收完成；Production 不在目標內。若繼續改善，先由使用者提出下一項 Staging／控制台需求。

Production 不在目標內。以下 M9 備份紀錄保留為歷史資訊，不是目前工作。

### 歷史停止點：M9-2 D1 空白基線備份／還原演練完成

已匯出兩個空 Production D1 的 Migration 前 SQL 備份，並各匯入本輪新建的隔離 APAC 暫存 D1，確認 0 張表／12 KB 後刪除暫存庫；Production D1 仍未套 Migration，沒有部署或正式資料變更。備份、SHA-256 與容量證據見 `_workspace/_reports/2026-10-21_tag_release_version_console/M9_2_D1_BACKUP_RESTORE_DRILL.md`。本次只證明空白基線匯入可行，不等於有 Migration／應用資料之還原已驗證。

最新唯讀盤點：Wrangler 登入目前只列出一個可用 Cloudflare Account，Production 與 Staging 資源均在其中；兩個 Production D1 為空。D1 可匯出 SQL 再匯入新帳戶 D1，無需搬移應用資料。Cloudflare API Token 只能以 User／Account／Zone 限定資源；D1 Edit 是 Account 層級，新 Worker 建立需要產品層級 Admin。詳見 `_workspace/_reports/2026-10-21_tag_release_version_console/M9_2_CLOUDFLARE_TOKEN_SCOPE_FINDING.md`。

2026-10-22 使用者已確認專案僅供興趣使用、不打算營運，因此 Production 正式版不需要。M9 停止、不建立 Token／Secret／Workflow／Worker、不部署、不套 Migration；已建立的空 Production D1 與 GitHub Environment 保留、不刪除。權限盤點不再是目前待辦。

目前 Staging Tag 發布流程支援 `game-demo`、`dineCore`、`project-b`；依 `_VibeCore/engineering/TAG_DEPLOYMENT_MANUAL.md` 使用 `dep_<project>_v<版本>`，普通 Push 不會部署。M7-4 管理頁替換、全新 Tag 自動部署及 Tag 更新／重用閘門均已遠端驗收。新手操作步驟另見 `_workspace/範本/自動部署指令使用步驟手冊.md`。

2026-10-21 里程碑文件已建立：`_workspace/_reports/2026-10-21_tag_release_version_console/EXECUTION_PLAN.md`。文件將工作拆為 M0 變更隔離、M1 Workflow 啟用、M2 首次 game Tag、M3 第二版與回退、M4 歷史 ZIP 原件回退、M5 D1 多專案、M6 唯讀控制台、M7 受控切版、M8 最佳化與保存、M9 Production，並補齊 Tag 不可變、Release 權限、Zip Slip、current／previous 真相來源、併發鎖與 D1 相容邊界。唯一下一步是 M0-1／M0-2 精確提交白名單；未完成前不得 Commit、Push 或建立部署 Tag。

2026-10-21 Tag 發布流程完成：一般 Push 已不觸發部署；新增 `dep_game-demo_vX.Y.Z`、`dep_dinecore_vX.Y.Z`、`dep_project-b_vX.Y.Z` 單目標 Tag 規則、手動救援選單、ZIP／manifest／SHA-256、短期 Artifact、成功後 GitHub Release 與各 Project 差異化 Migration／Smoke。新增 Tag 測試，Worker 45／45 通過；本機實際產生 ZIP、50 檔 manifest、checksum 與 unzip 完整性通過；Workflow YAML 可解析。操作手冊位於 `_VibeCore/engineering/TAG_DEPLOYMENT_MANUAL.md`。尚未 Commit／Push，故遠端 Actions 尚未套用；本輪未建立新 Tag、未再次部署。

2026-10-21 部署更新：`game-demo` 已以獨立 Static Assets Worker 發布至 `game-demo-staging.takoson68.workers.dev`，版本 `3a9f38ae-5e7c-4d43-8de6-0c677c0e4a20`。首頁、任意深層路徑 SPA fallback 與入口 JavaScript 資產皆回傳 200；未建立 D1、未修改 dineCore／project-b Worker。新增 `platform/worker/wrangler.game-demo-staging.json`，尚未 Commit／Push，也尚未加入既有 GitHub Actions 自動部署矩陣。

2026-10-21 最新停止點：已將同層 `moduCore_Game` 的遊戲能力以增量方式融入 `moducore_platform`，保留既有 Projects、預設 Project 與部署流程。新增 Game 私有容器／生命週期、p5 與 FPS 適配、game-demo Project、`test:game`；Container 僅增加可匯出及 services 注入，平台單例維持相容。遊戲測試 5／5、game-demo、project-a、project-b build 與 diff check 通過，未 Commit／Push／部署。

唯一下一步：由使用者在 `platform/frontend` 以 `VITE_PROJECT=game-demo npm run dev` 實際試玩並確認互動方向；若要納入遠端發布，再獨立決定部署目標，不沿用現有 dineCore／project-b Staging。`npm audit --omit=dev` 回報的 5 項 high severity 已記錄 ISSUE-20261021-001，需另批升級驗證。

2026-10-16 最新停止點：前端 ZIP 版本管理里程碑分析完成，FRONTEND_RELEASE_MILESTONE_PROPOSAL.md 已產出，EXECUTION_SPEC 加入明確標示為提案的 M4.1-A／B、M8-A／M9 對應及成本補充。來源為桌面 h5-dist-preview 實際 ZIP／release／current／previous 機制與目前 Workflow。僅更新文件，未改程式／Workflow、未 Commit／Push／部署。

唯一下一步：使用者確認是否優先做 M4.1-A（同次建置 ZIP＋manifest＋校驗＋短期 Artifact），及保留期（建議 7 天、須先量用量），再開始工程。M4.1-B 為下載包本機還原；M8-A 只讀版本列表；M9 控制／外部 ZIP 上傳另行確認。不新增 R2／付費服務，不把成品封存當線上發布或資料庫備份。既有 .env／AI 變更保留。以下為歷史停止點。

2026-10-16 最新停止點：使用者授權自行設定簡單測試帳密。已透過既有受控 CLI 在 project-b-staging 建立首位持久管理員；沿用最低 15 字元與 scrypt，不修改安全檢查。線上瀏覽器登入成功、員工管理載入成功（0 人），分頁保留供使用者操作。帳密只於本次交付提供，不記錄於文件或 Git。未建立對應員工資料，未在 dineCore 建帳戶。

使用者詢問 Git／專案切換：已實際比對本機與遠端 world-oop 同為 86810ff；程式在 /Users/zhangyu/Desktop/mytemp/moducore_platform 修改後推送。AI／治理文件、報告及既有 .env 仍未提交；不要聲稱所有檔案已同步。線上兩專案固定獨立入口，本機及建置由 VITE_PROJECT 選擇；尚無後台切換／新增專案入口管理功能。本輪不改程式、不再 Commit／Push／部署。下一步由使用者操作員工後台回饋，再確認後續範圍。

2026-10-16 最新停止點：使用者已允許 Commit／Push／兩站部署。M4 工程 86810ff 已推送 world-oop，CI 38863036522 全部成功，含兩站 Migration／部署／Auth 隔離及 project-b Employee Smoke（deleted）。新版本 project-b 7c13f778-0a2b-4c03-aed3-15f2bb4b8349、dineCore 048d3a62-540f-4cb9-a7ce-e7f0eccaebc9；舊站 2a42b8d1-62ae-4a53-b457-12d0f465c400 未變。兩新庫 Migration=4、users／tokens／employees=0、FK 無錯。報告 M4_E_DEPLOYMENT_RESULT.md。

唯一下一步：與使用者確認 project-b 首位真實管理員帳號／顯示名稱，密碼由使用者安全輸入、不貼對話；遠端建立需符合明確帳戶授權，不能用這次部署授權自行決定身份。M4 線上合成 Gate 已通過，但沒有可供本人使用的帳戶；不自動移植下一專案。工程已提交，.env、AI／治理文件與報告保留本機。保守歷史刪除及通知延後限制仍在；本輪未重演 rollback、帳單／日用量未確認。以下為歷史停止點。

2026-10-16 最新停止點：M4-E 發布準備完成，見 M4_E_RELEASE_PREPARATION.md。新增 Employee Smoke 契約／固定 project-b 遠端 runner，CI 接在 Auth 之後；共用契約在一次性 D1 通過，後端 43／43、最近前端 18 項合計 61。dineCore real build、兩站 Wrangler dry-run、diff check 通過。遠端 runner 未執行；無遠端寫入、Migration、Commit／Push 或部署。

唯一下一步：取得明確授權後，依工程白名單 Commit／Push world-oop，兩站 Staging 自動發布／0004／Auth 隔離與 project-b Employee 合成驗收。共用更動會發布 dineCore 與 project-b，兩庫皆新增空 Employee 表；舊站不在矩陣。發布前核對當下版本／資料／用量；保留 .env、AI／治理文件與報告，不全量 add。清理或 Smoke 失敗維持失敗，不宣告 G3。以下為歷史停止點。

2026-10-16 最新停止點：M4-D2 本機角色驗收完成。主管一般員工修改、角色選項限制、保護資料後端拒絕；本人電話更新、無關聯提示、API 故障／恢復重試、真正不同 user_id 換帳號隔離均經瀏覽器驗證。本人成功 alert 改頁面提示，Layout 清理鍵含 tenant／id／role，還原忙碌文案改處理中。60 項測試、real build、diff check 通過。報告 M4_D2_ROLE_RESULT.md；合成 fixture／帳戶僅本機，程序／分頁已關閉、DB 丟棄。未 Commit／Push／部署。

唯一下一步 M4-E 發布準備：核對所有 M4 未提交工程、隔離既有 .env／AI 文件、確認共用 0004 的兩目標影響，補 Employee 遠端 Smoke 與清理／回復計畫；取得明確發布授權後才 Commit／Push／Migration／部署。CI 現有 Auth Smoke 不等同 Employee 線上 Gate。保守歷史刪除限制與通知延後保留，G3 尚未通過。以下為歷史停止點。

2026-10-16 最新停止點：M4-D 核心畫面串接完成，管理員本機瀏覽器新增／修改／重整讀回／二次確認刪除／登出通過。移除密碼欄位與持久化、本人精確 user_id 關聯、HTTP 錯誤／重試、登出與換身份清理、延遲回應隔離、移除 notification 私有 import。60 項自動測試通過（42 後端＋11 登入＋3 傳輸＋4 員工服務／Store），real build 與 diff check 通過。詳見 M4_D_FRONTEND_RESULT.md。測試分頁、程序與一次性 DB 已關閉，沒有遠端改動、Commit／Push／部署。

唯一下一步：M4-D2 主管與一般員工完整瀏覽器矩陣、本人電話／無關聯／錯誤／換身份驗收。不可把管理員流程當成全部 UI Gate；仍未進入 M4-E。本人成功 alert 未驗收、歷史刪除精確限制仍在。既有 .env 與無關 AI 修改保留。以下為歷史停止點。

2026-10-16 最新停止點：使用者已同意 M4-C 角色與停用／刪除／通知規則，Worker Employee CRUD 本機完成。新增 src/employees.js、test/employees.test.js；註冊四條舊路徑，更新 Runtime 測試與本機工具模組清單。42／42 後端測試通過（含真實 Workers Runtime CRUD），git diff --check 通過；報告 M4_C_CRUD_RESULT.md。沒有遠端寫入、Commit／Push 或部署。

唯一下一步 M4-D：員工畫面串接、移除密碼持久化、本人精確關聯、錯誤呈現、跨模組私有 import 清理與登出資料清理，再做本機瀏覽器驗收。刪除在其他 project_b_* 業務表存在時保守全拒絕，非精確引用判定；ISSUE-20261016-005 追蹤。未動既有 .env／無關 AI 文件，以下為歷史停止點。

2026-10-16 最新停止點：使用者選 A（員工與登入帳戶分開）。M4-B1／B2 已本機完成：0004_project_b_employees.sql、test/employee-schema.test.js，Worker 35／35 測試通過；空庫／重跑、身份與 Token 保留、交易回復、FK／唯一約束及並行編號均已驗證。報告 M4_B_SCHEMA_RESULT.md。未建立遠端帳戶、未套遠端 Migration、未 Commit／Push／部署，前端既有修改保留。

唯一下一步：M4-C Employee CRUD。先確認主管管理範圍、刪除限制、員工狀態與登入狀態連動、通知延後等業務政策，不能把選 A 解讀為全部授權。Schema 的 role／status 僅員工資料，不直接授權或修改 users。共用 Migration 目錄發布前須核對各目標，避免忽略 dineCore 亦套用空表的影響。以下為歷史停止點。

2026-10-16 最新停止點：M4-B0 員工來源核對與執行草案完成，見 M4_B_EMPLOYEE_SPEC.md。已校正批次：正式規格 M4-B 是 Schema／Migration／fixture，M4-C 才是 CRUD。確認舊員工建立不建 users、密碼欄位無效、member_id 與 users.id 不同；本人查找回退可能更新錯誤 id，通知有跨模組私有 import。未改工程、未建 Migration 或遠端資料。

唯一下一步：請使用者確認「員工資料與登入帳戶分開、可無帳戶、不自動開通登入」或「新增員工同時建帳戶」。這會改變資料及對外行為，不能默默代決；確認後做 M4-B1／B2 本機 Schema 驗證。M4-C 的主管範圍、刪除與通知政策仍需確認。M4-A 未提交／部署，既有 .env／AI 修改保留。以下為歷史停止點。

2026-10-16 最新停止點：M4-A3 本機前端＋實際 Worker＋一次性 D1 整合驗收通過，涵蓋登入、深層網址重整、過期／停用返回公開頁及登出持久撤銷。修正 project-b/layout/LayoutRoot.vue 在 authStore 失去登入後仍保留受保護頁的問題，未改共享 Router／World。11 項前端、3 項 API、31 項後端測試及 real build 通過。報告 M4_A3_AUTH_E2E_RESULT.md；本機程序／分頁已關閉，一次性 DB 已丟棄。

唯一下一步以此為準：M4-B Employee 資料模型、角色／帳戶關聯契約與 CRUD 垂直切片。Employee API 尚未移植，空表不代表完成。M4-A1～A3 尚未 Commit／Push／部署；不得沿用 M3.1 授權。真實管理員資訊及遠端建立另待確認；本機驗收不等同 Staging Gate。既有 .env／AI 文件未覆蓋。以下皆保留為歷史停止點。

2026-10-16 最新停止點：M4-A2 受控 CLI 已本機完成，worker/scripts/provision-project-b-admin.mjs、project-b-provisioning.mjs、test/provisioning.test.js 與 package.json admin:project-b 指令新增；後端 31／31 通過，含原子首位管理員建立、並行僅一筆、重跑不覆寫、同名普通帳戶不升權、固定遠端目標 fetch 模擬、CLI stdin 安全及遠端確認防護。另 PTY 兩次合成密碼輸入無回顯，remote=false、一次性 DB 退出即丟棄。沒有真實／遠端帳戶、網路佈建、Migration、Commit／Push 或部署。報告 M4_A2_PROVISIONING_RESULT.md。

唯一下一步以此為準：M4-A3 本機合成帳戶的前端＋Worker＋D1 整合驗收，實際登入、重整還原、深層路由、過期／停用與登出撤銷。不得把目前函式／API Smoke 視為前端 Gate 已通過；真實帳號、名稱、專案管理角色與遠端建立仍待確認，密碼不可貼對話。M4-A1 變更與本輪 CLI 仍未提交，既有 .env／AI 文件未覆蓋。

2026-10-16 最新停止點：M4-A1 project-b 登入面板已本機修正：空帳密、無示範提示、登入／還原／登出例外收尾、安全錯誤訊息與 loading／密碼清理；10 項面板邏輯、3 項 API 測試與 project-b real build 通過，本機瀏覽器確認初始畫面。新增 frontend/scripts/test-project-b-auth.mjs、package.json 測試指令與 Workflow project-b 測試步驟，尚未 Commit／Push／部署。未建立帳號，既有 .env 未修改；詳見 M4_A1_LOGIN_PANEL_RESULT.md。

唯一下一步以此為準：M4-A2 受控 project-b 帳戶佈建 CLI，先做本機合成資料與安全輸入／原子性／重跑拒絕測試；不直接建立真實帳號或部署。真實帳號與角色仍待確認、密碼不得貼對話。M4-A 整體 Gate 未完成；以下來源核對與 M3.1 為歷史證據。

2026-10-16 最新停止點：已開始 M4-A，來源核對與建議佈建契約見 M4_A_AUTH_PROVISIONING_CONTRACT.md。確認實際入口為 project-b ProjectTopbar → project-b/components/PlatformLoginPanel.vue → world.authApi；不是共享 LoginModal。面板預填示範帳密／提示不一致且 rejection 收尾不完整，已記錄 ISSUE-20261016-002。員工表單收密碼但無 username、舊 API 不建 users，帳戶佈建不可假設已完成。

本輪只更新文件，不建帳戶、不修改程式、不 Commit／Push／部署。建議下一步 M4-A1：修 project-b 登入面板、清除示範預填與提示、補錯誤／loading 收尾並完成本機測試；之後才做受控 CLI 佈建與合成前端驗收。真實帳號／角色仍待指定，密碼不得貼入對話。以下 M3.1 完成證據保留；先前「M4 尚未開始」現應解讀為 M4-A 來源核對已開始，其餘實作未開始。

2026-10-16 最新：M3.1 固定入口與隔離自動部署已驗收。使用者允許 Commit／Push，工程 3aa2f58 已推送 world-oop；CI 38856141952 的 dinecore-staging／project-b-staging 皆成功。刻意失敗 CI 38856271678 依預期在 Migration／部署前停止，三站版本與 DB 檢查前後一致，不是線上故障。以下 M3 與手動版本皆為歷史恢復點；最新停止點以本段為準。

線上 dineCore：https://dinecore-staging.takoson68.workers.dev/，版本 cf5ee141-9ed6-422d-8b08-7ba7128be32d；project-b：https://project-b-staging.takoson68.workers.dev/，版本 cd48490c-e0db-4f3c-a4b9-ccb70cd91eef。舊站版本 2a42b8d1-62ae-4a53-b457-12d0f465c400 未變。三庫最終 users／Token 皆 0、Migration 三筆、FK 無錯。詳見 M3_1_B_D_RESULT.md。

**唯一下一步：與使用者確認開始 M4 project-b 帳戶佈建／Employee 垂直切片，先固定來源契約再實作；本輪停止，不自動延伸業務功能。** M0 Recovery Codes 與當日用量／帳單再驗證仍待確認。工程已提交；既有 AI 文件、frontend/.env、工作紀錄與報告未混入提交。

moduCore 的 M1、M3／G2 已驗收。M3 遠端 PBKDF2 上限已定位，改用 scrypt 安全參數並新增 0003，20 項後端測試、3 項前端傳輸驗證、5 專案 Build、遠端 Auth 與 Worker 回復／恢復均通過。最新 CI 38710616816 全數成功；M4 尚未開始，其餘業務 API 未移植。Recovery Codes 保存仍待確認。

## 已確認方向

- 保留 moduCore 前端 World、Container、Module、Store、Router 與 UI Slot 架構。
- 前端目標為 Cloudflare Static Assets。
- 後端完整替換為 Cloudflare Workers JavaScript。
- 資料庫改為 Cloudflare D1／SQLite。
- 每個 Project 原則上獨立 Worker，資料型專案使用獨立 D1。
- 2026-10-15 已確認：各專案應有固定網址／子網域並同時存在，不再輪流替換同一測試站。規格新增 M3.1 固定入口與隔離 CI、M8-A 唯讀管理後台、M9 控制操作候選；尚未實作或授權新建資源。
- 不預先導入 Express、Hono、ORM、Repository 或微服務。

## M0 環境檢查

- Cloudflare 帳號：已在正確的 Chrome `yu` 設定檔中進入 Dashboard；帳號 Email 已驗證，為 `takoson68@gmail.com`。
- GitHub Repository：`origin` 已確認指向 `https://github.com/takoson68/moducore_platform.git`。
- Branch 連線：目前 `world-oop` 正常追蹤 `origin/world-oop`。
- GitHub 帳號：已在同一個 Chrome `yu` 設定檔中登入；頁面確認目前帳號擁有 `takoson68/moducore_platform`。
- Cloudflare／GitHub 身分：Cloudflare 使用 `takoson68@gmail.com`，GitHub 使用者為 `takoson68`，帳號身分一致；未以登出重登入方式破壞性重測 OAuth Callback。
- Cloudflare 2FA：電子郵件雙因素認證已啟用；Recovery Codes 尚待使用者保存確認。
- Cloudflare 方案：使用者確認目前維持 Free Plan。
- Cloudflare API Token：`moducore-github-actions-staging` 已建立且 Dashboard 顯示啟用；權限限於單一帳戶的 Workers 指令碼編輯與 D1 編輯。Token 曾由使用者貼入對話，使用者已知悉並決定保留供測試使用。
- GitHub Secrets：兩項 Secret 已由成功 CI 驗證可用；Token 曾有 Authorization 格式錯誤，使用者更新後已排除。
- Repository 憑證檢查：未找到 Cloudflare Token；只找到既有文件內的一般 `Authorization: Bearer` 範例。
- GitHub Actions、Worker 與 D1：已建立，部署網址為 https://moducore-staging.takoson68.workers.dev 。
- `workers.dev`：依 Cloudflare 現行機制，每個 Worker 建立時自動取得路由，實際 URL 改由 M1 驗證，不再要求 M0 先建立不存在的 Worker。

## 已完成

- 完成專案架構與 Cloudflare 相容性分析。
- 驗證 project-a、project-b、dineCore、flowCenter、modudesk 均可完成 Production Build。
- 產出簡短報告與執行規格書。
- 參考 `h5-basic-style`，建立 `_ai-context/` AI 操作層，補強通用入口、最小導讀、工程摘要、工作流程、Git、語言、資料分流與恢復點。

## 相關文件

- `_workspace/_reports/2026-10-15_moducore_cloudflare_node_d1/README.md`
- `_workspace/_reports/2026-10-15_moducore_cloudflare_node_d1/EXECUTION_SPEC.md`
- `_workspace/_reports/2026-10-15_moducore_cloudflare_node_d1/M3_RESULT.md`
- `_workspace/_reports/2026-10-15_moducore_cloudflare_node_d1/M3_AUTH_CONTRACT.md`
- `_workspace/_reports/2026-10-15_AI工作機制比對與升級報告.md`

## 工作樹注意事項

- `platform/frontend/.env` 在本輪開始前已有使用者修改，不得覆蓋或納入其他變更。
- 使用者已解除分析限制並授權 M1；新增 Worker、Workflow 與 Cloudflare 建置模式。

## 下一步

2026-10-16 最新停止點：使用者已授權「保留舊站舊庫＋建立兩個新入口與獨立 D1，部署及隔離驗證」。已建立並部署 dinecore-staging（D1 10230112-5e9d-4ed7-ad17-d836896e64b1、版本 a72871b0-22b2-4f84-b419-fb13760c6f31）與 project-b-staging（D1 d446407c-6c4b-4746-b0fb-7368d850986c、版本 fe975fd2-3720-4f82-ac4c-b58e56869af2）。舊站與舊庫保留，舊版本 2a42b8d1-62ae-4a53-b457-12d0f465c400 未變。22 項後端、3 項前端測試通過；兩站 real build、dry-run、遠端 Auth、真正跨網址 Token／D1 隔離、dineCore 更新／回復不影響 project-b 或舊站、刻意失敗 dry-run 不改遠端版本均已驗證。三庫最終 users／tokens 皆 0、外鍵無錯。詳細見 M3_1_B_D_RESULT.md。

本輪工程尚未 Commit／Push：新增兩個 Wrangler JSON、scripts/deployment-targets.mjs、scripts/smoke-isolation-rollback.mjs、部署設定測試；修改 Worker health 服務標記、smoke 目標化、.gitignore 及多目標 Workflow。後者目前只在本機，GitHub 仍發布舊站。使用者既有 frontend/.env 與 AI 文件不得混入工程提交。

本段手動部署後的停止點已被上方最新狀態取代：使用者已允許 Commit／Push，多目標 CI 及安全失敗演練均已通過。M4／M6 業務 API 尚未移植；dineCore 首頁可能顯示無法建立點餐身份。合計 3 Worker／3 D1，未變更付費方案；實際用量／帳單仍未再驗證。

追加任務已完成：Staging 已從 project-a 切換為 dineCore，使用者明確允許 Commit／Push／自動部署。提交 e954ab9、73b72bc 已推送 world-oop；CI 38712004231 全數成功，線上版本 2a42b8d1-62ae-4a53-b457-12d0f465c400。瀏覽器確認「桌邊點餐」首頁，dineCore Session 200、project-a 403，完整遠端 Auth 通過且合成帳戶已清除。Cloudflare build／CI／Worker／Auth smoke 專案識別同步。保留本機 .env，線上仍為 real API；dineCore 業務 API 尚未移植，不能宣稱點餐或營運已完成。GitHub 預設分支為 world-oop。詳見 STAGING_DINECORE_RESULT.md；下列 M3 線上版本為歷史證據，最新以本段為準。

2026-10-16 本輪已執行 M3.1-A 唯讀盤點，文件 M3_1_A_DEPLOYMENT_INVENTORY.md 已產出、待驗收。Cloudflare Worker 清單為 1 個 moducore-staging；直接 D1 API 清單為 1 個 moducore-staging-db、69632 bytes。SQL 管理查詢失敗 7500 SQLITE_AUTH；wrangler d1 list 失敗 10000，但直接清單成功，不可推論無 DB。公開首頁／health／dineCore Session 正常、project-b 403。帳單 API 403、當日用量未知；standard usage model 不代表 Free 方案證明。沒有建立資源、Migration、寫入測試、Commit、Push 或部署。

後續診斷已完成：SQLITE_AUTH 可由 PRAGMA page_count 單獨重現；一般 SQL、page_size 與 Wrangler d1 list 重測成功，不需要擴權或重新登入。已確認三筆 Migration，users=0、user_tokens=0，所有查詢 rows_written=0；原先 list 10000 暫時失敗原因未定。報告已更正，ISSUE-20261016-001 移至 RESOLVED_ISSUES。

唯一下一步：請使用者驗收 M3.1-A，確認「保留舊站舊庫＋新增 dinecore-staging／project-b-staging 與兩新庫」方案；方案／當日額度仍待確認，再取得 M3.1-B～D 建立、發布授權。此方案合計 3 Worker／3 D1，未實際建立。本輪沒有擴權、重登入、建立或部署。M4 的 Staging 不再覆蓋 dineCore，業務移植順序仍為 M4～M7。最新線上版本以上段追加任務為準。

使用者確認舊 MySQL 只有測試資料可重建，不授權刪除舊庫。舊 PHP 執行環境不可用只記為比對限制，不再作為 M3 阻擋條件。其餘路由依 M4～M7 逐批固定契約、實作並測試。

Migration 現況：遠端 0001、0002_auth.sql、0003_scrypt_credentials.sql 均已套用；外鍵無錯、驗收帳戶已清除。Worker 回復不撤銷 D1 Schema，不修改已套用的 Migration。舊 PHP／MySQL 未刪除。

已完成首次 Staging 部署：https://moducore-staging.takoson68.workers.dev 。首次手動版本為 `1434863c-9f5e-44cf-80cb-ebf1da86db29`，之後另有成功 CI 發布，最新遠端版本須由部署紀錄確認。M1 遠端首頁與 `/about` 回傳 HTML 200，`/api/health` 回傳 database=ok，未知 API 回傳 JSON 404。

GitHub CLI 已登入 takoson68 並經使用者允許新增 workflow 權限。`7cc9e65` 與 `f042cf5` 已 Push 至 origin/world-oop，既有 AI 文件與 `.env` 未納入。

CI https://github.com/takoson68/moducore_platform/actions/runs/38692452088 在 Secret 更新後重跑成功，包含 migration、部署與公開 HTTP smoke。安全演練 https://github.com/takoson68/moducore_platform/actions/runs/38692842610 按預期在 Simulate safe staging failure 退出，migration 與部署均跳過；該次紅色狀態是刻意測試。

## 2026-10-27｜M1 獨立 platform-chat Staging 部署

- 本次目標：將平台級 Chat PoC 以獨立 `moducore-chat-poc-staging` Staging 目標發布，不併入 `magic-siege`。
- 已完成：部署白名單加入 `platform-chat`、獨立 Wrangler 設定、WebSocket remote smoke gate；`v0.1.0`／`v0.1.1` 因 smoke 時序失敗，`v0.1.2` 因 target 命名未符合控制台格式，均未建立成功 Deployment。
- 本機驗證：Worker 70/70、Chat contract 4/4、Chat PoC 4/4、Wrangler dry-run 通過。
- 驗收完成：`dep_platform-chat_v0.1.3`／Commit `0b2d391` 已部署至 `https://moducore-chat-poc-staging.takoson68.workers.dev`；兩個遠端 WebSocket 客戶端廣播 smoke 通過，Release 與 verified deployment state 已建立。
- 下一步：進入 M2，設計 Platform Chat Capability API；不修改遊戲內部 Store。
## 2026-10-27｜M2 Platform Chat 前端 Runtime 完成

- 新增平台級 `platform/frontend/src/chat/`：`Chat`、`MessageStore`、`ConnectionService`、`MessageService`、mock WebSocket adapter。
- `Chat` 每個實例建立原始 `Container`；不使用平台 Singleton，不依賴 Game Store，也不持有 Game 生命週期。
- 驗證：`npm run test:chat` 3/3 通過；`VITE_PROJECT=magic-siege npm run build:cloudflare` 通過。
- 尚未接入任何 Project UI；下一步為 M3，讓 `magic-siege` 以 opt-in 方式掛載 Chat。
## 2026-10-27｜M3 magic-siege Chat 宿主整合完成

- `magic-siege` 透過 `project.config.js` 的 `chat` opt-in 設定掛載平台 Chat；Chat 核心仍位於 `platform/frontend/src/chat/`。
- 新增可收合 `ChatPanel.vue`，預設不遮擋地圖；遊戲 reset／pause／visibility 流程不會控制 Chat。
- 驗證：`npm run test:chat` 3/3、`npm run test:game` 8/8、magic-siege Cloudflare Build 通過。
- 已部署：`dep_magic-siege_v0.1.44`／Commit `e8bd5f2`，Workflow 與 Static SPA smoke 通過；公開網址為 `https://magic-siege-staging.takoson68.workers.dev/`。
- 下一步：手機人工驗收聊天室收合、展開、發送與遊戲控制不遮擋。
## 2026-10-27｜Platform Chat 玩家編號完成

- Chat Worker 會在公共房間為每個連線分配 `player_001`、`player_002`……，並在 `chat.ready` 與訊息 sender 提供伺服器產生的編號／顯示名稱。
- 前端 Chat Store 保存自己的 identity，聊天室面板顯示「你的編號」與每則訊息的玩家編號。
- 驗證：Chat Worker 4/4、Worker 全套 70/70、Chat Runtime 3/3、magic-siege Build 通過。
- 尚未部署本輪變更；需發布平台 Chat 新版本後，magic-siege 才會在既有網址看到編號。

## 2026-10-27｜Platform Chat 自己訊息辨識樣式

- 聊天面板依伺服器分配的 `playerId` 比對自己的訊息，套用淡色外框與淡背景；不信任客戶端自報身份。
- `npm run test:chat` 3/3、magic-siege Cloudflare Build 通過。
- 已發布：Platform Chat `dep_platform-chat_v0.1.4` 與 magic-siege `dep_magic-siege_v0.1.45`；兩個 Workflow、WebSocket smoke、Static SPA smoke 與 verified deployment state 均通過。
## 2026-10-27｜Platform Chat namespace rollover

- 發現既有 Durable Object `magic-siege:public` 熱執行個體仍執行舊版程式，故線上仍回傳 `anonymous_*`；不是前端身份比對錯誤。
- Chat Worker 改用 `CHAT_NAMESPACE_VERSION=2` 建立新 namespace，避免舊房間執行個體遮蔽玩家編號更新。
- 已發布 Platform Chat `dep_platform-chat_v0.1.5`；遠端 `chat.ready` 已確認回傳 `player_001`／玩家001。

## 2026-10-27｜M4-A 純 Container 基準測試

- 新增 `platform/frontend/scripts/container-benchmark.mjs` 與 `npm run benchmark:container`，直接使用原始 `Container`，測量單一／三實例生命週期、三實例各自 Store 更新，以及 1,000 次建立／銷毀循環。
- 基準通過：三 Container 建立／銷毀中位數 0.0194 ms；三 Container 各更新 1,000 次中位數 4.9485 ms；循環 1,000 次中位數 0.4815 ms。
- 報告：`_workspace/_reports/2026-10-27_platform_chat_m4a_container_benchmark/RESULT.md`；M4-A 前四項已勾選，Game + Chat 完整負載仍待 M4-B。
- 唯一下一步：進行本地模擬訊息與真實 WebSocket 的 Game + Chat 負載測試，觀察 FPS、訊息延遲、DOM 更新與斷線資源釋放。

## 2026-10-27｜M4-B 首輪 Chat 負載測試

- 新增 `platform/frontend/scripts/chat-load-benchmark.mjs` 與 `npm run benchmark:chat-load`，完成 0／5／50／200 則／秒的本地 Chat Store 負載矩陣；200 則輸入在 ring buffer 上限 100 下保留 60 則，沒有無限增長。
- 新增 `platform/worker/scripts/benchmark-chat-remote.mjs`，Staging 兩連線、20 則真實 WebSocket 廣播／ack 通過，p95 延遲 150.55 ms；結果見 `_workspace/_reports/2026-10-27_platform_chat_m4b_load_benchmark/`。
- `npm run test:chat` 3/3、`npm run test:game` 8/8 通過。
- 尚未完成瀏覽器 DOM／p5.js FPS、手機背景切回與長時間記憶體測試；下一步需用實際瀏覽器做 M4-C（裝置驗證）再決定是否進 M5。

## 2026-10-27｜M4-C 首輪瀏覽器驗證

- Staging 瀏覽器驗證通過：聊天室收合／展開、玩家編號、已連線狀態、重新載入後重新連線均正常；收合時不遮擋遊戲畫布。
- 驗證報告：`_workspace/_reports/2026-10-27_platform_chat_m4c_browser_verification/RESULT.md`。
- 尚未完成：真實 iOS Safari／加入主畫面背景切回、低階手機 FPS、長時間記憶體與斷線重連裝置測試。
- 唯一下一步：在使用者手機上完成 M4-C 裝置驗收；若通過，再進入 M5 第二個 Project 移植驗證。

## 2026-10-27｜M4-C 裝置驗收完成／M5 首輪移植

- 使用者確認手機手測可以；M4-C 首輪裝置驗收完成，剩餘僅低階手機長時間與背景切回的補充測試。
- `game-demo` 已掛載同一平台 Chat Runtime：Page 只建立 `Chat`／`ChatPanel`，卸載時 dispose，沒有複製平台核心。
- `game-demo` 使用獨立 `game-demo` room namespace；`npm run test:game` 9/9、`VITE_PROJECT=game-demo npm run build:cloudflare`、deployment plan 測試通過；結果見 `_workspace/_reports/2026-10-27_platform_chat_m5_game_demo_portability/RESULT.md`。
- 唯一下一步：建立或確認第二個 Project 的 Staging 發布入口，使用獨立 room namespace 做跨 Project 隔離測試；目前未部署。

## 2026-10-27｜M5 Staging 部署前隔離驗收

- `https://game-demo-staging.takoson68.workers.dev/` HTTP 200，既有入口可存取。
- Worker Chat 隔離測試 4/4 通過：不同 room 與不同 projectId 不互相廣播。
- 本輪未建立 Deployment、未向公開聊天室送出測試訊息；報告見 `_workspace/_reports/2026-10-27_platform_chat_m5_staging_preflight/RESULT.md`。
- 已發布 `dep_game-demo_v0.1.5`，Workflow `40443472096` 成功，網址 `https://game-demo-staging.takoson68.workers.dev/` 回應 HTTP 200。

## 2026-10-27｜M5 roomId 連線修正與雙站重新發布

- 發現根因：Chat 建立 WebSocket 時未把 `roomId` 放入 URL，兩個 Project 都落到 Worker 預設 `public` room。
- 修正 `buildChatConnectionUrl()` 並新增 runtime 測試；Chat 4/4、Game 9/9、magic-siege／game-demo build 均通過。
- 已發布 `dep_game-demo_v0.1.6`（Workflow `40443860075`）與 `dep_magic-siege_v0.1.47`（Workflow `40443860035`），報告見 `_workspace/_reports/2026-10-27_platform_chat_m5_room_isolation_fix/RESULT.md`。
- 唯一下一步：使用者重新整理兩個網址後，各送一則測試訊息，確認 `game-demo` 與 `public` room 不互相收到。

## 2026-10-27｜Chat 標題顯示目前玩家編號

- Chat 標題改為 `公共聊天室・玩家XXX`；尚未取得伺服器身分時回退為 `公共聊天室`。
- `dep_game-demo_v0.1.7`（Workflow `40444022863`）與 `dep_magic-siege_v0.1.48`（Workflow `40444022843`）均成功。
- 瀏覽器重新載入 magic-siege 後已確認標題顯示 `公共聊天室・玩家011`。

## 2026-10-27｜Chat 標題改為聊天室識別

- 使用者確認標題應顯示聊天室，而非玩家；標題已改為 `聊天室・public`／`聊天室・game-demo`，玩家編號仍保留在展開內容。
- `dep_game-demo_v0.1.8`（Workflow `40444244504`）與 `dep_magic-siege_v0.1.49`（Workflow `40444244576`）均成功。
- 以 `?v=0.1.49` 重新載入 magic-siege 已確認畫面顯示 `聊天室・public`；若瀏覽器仍顯示舊標題，請加版本 query 或強制重新整理以清除舊 bundle cache。

## 2026-10-27｜平台聊天室管理入口（未部署）

- Chat Worker 新增 Durable Object 房間目錄：WebSocket 首次連線會自動註冊房間，管理 API 支援公開列出、`super_admin` 建立／改名／停用。
- 管理 API 由 Chat Worker 轉向既有 `dineCore` `/api/session`，以 `X-Project: dineCore` 與 Bearer token 驗證資料庫中的 `super_admin`；前端不自行信任角色。
- 新增平台共用 `platform/frontend/src/chat/ChatRoomAdminPanel.vue`，dineCore 僅以 `chat-admin` 模組掛載 `/staff/platform/chat-rooms` 管理入口。
- 驗證：Chat Worker 5/5、Chat Worker dry-run、`VITE_PROJECT=dineCore npm run build:cloudflare` 通過。
- 尚未部署；下一步是依使用者授權發布 Chat Worker 與 dineCore，並以既有 dineCore super_admin 登入測試建立、改名、停用及跨 Project 自動出現。

## 2026-10-27｜平台聊天室管理入口已發布

- Commit `dd14bf3` 已推送至 `world-oop`，並建立 `dep_platform-chat_v0.1.6`、`dep_dinecore_v0.1.1`。
- Chat Worker Workflow `40449039297` 成功；公開 `/api/chat/rooms` 回應 HTTP 200，目前已列出 `public` 房間。
- dineCore Workflow `40449039658` 成功；`https://dinecore-staging.takoson68.workers.dev/staff/platform/chat-rooms` 回應 HTTP 200。
- 兩個 Workflow 的 Worker 測試、Build、部署、公開端點、驗證流程與 verified deployment state 均通過。
- 待使用者以既有 `dineCore super_admin` 登入 dineCore，進入「平台聊天室」完成建立、改名、停用的端對端人工驗收。

## 2026-10-27｜聊天室 10 分鐘閒置斷線（未部署）

- Chat Worker 對每條 WebSocket 連線設定 10 分鐘閒置計時器；收到有效客戶端事件會重設計時，逾時以專用 close code `4000`／`idle_timeout` 關閉。
- 前端 `ConnectionService` 收到閒置關閉後停止自動重連，避免閒置連線被無限重建；使用者重新展開聊天室或聚焦輸入框時才重新連線。
- 驗證：Chat Runtime 5/5、Chat Worker 5/5、Worker dry-run、dineCore Cloudflare build 通過。
- 尚未部署；需另建立 `dep_platform-chat` 與受影響 Project 的新版本後，才可在線上以 10 分鐘規則驗收。

## 2026-10-27｜dineCore 平台聊天室測試帳號

- 已在遠端 `dineCore` D1 建立原有快速登入使用的 `manager` 測試帳號，角色為 `manager`、狀態啟用；密碼只以 scrypt 雜湊保存，未寫入程式或報告。
- 原先為了測試平台聊天室暫設的 `super_admin` 角色已修正回 `manager`，以符合 dineCore 快速登入與既有 mock 行為。
- dineCore `/api/login` 與 `/api/session` 驗證成功。
- 針對 Chat Worker 寫入權限驗證發現跨 Worker `/api/session` GET 可能命中快取，已補上 `cache: 'no-store'` 與 `Cache-Control: no-cache`；修正尚未部署。
- 待下一次 Chat Worker 發布後，再用此帳號完成聊天室建立／改名／停用端對端驗收。

## 2026-10-27｜閒置斷線與驗證快取修正已發布

- `dep_platform-chat_v0.1.7`、`dep_magic-siege_v0.1.50`、`dep_game-demo_v0.1.9` 已成功部署。
- Workflow：`40450044037`、`40450044498`、`40450044676`；三個 staging Smoke Gate 均通過。
- Chat Worker `/api/chat/rooms` HTTP 200；magic-siege 與 game-demo 公開入口 HTTP 200。
- 10 分鐘閒置斷線與身份驗證 `no-store` 修正已上線；dineCore `manager` 測試帳號仍維持原本 `manager` 角色。

## 2026-10-27｜建立平台聊天室 super_admin 並修正跨 Worker 驗證

- 已在遠端 `dineCore` D1 建立獨立的 `super_admin` 測試帳號（帳號密碼已直接交付使用者，未寫入文件）；原有 `manager / manager123` 仍維持 `manager` 快速登入用途。
- `dep_platform-chat_v0.1.10` 已發布，Workflow `40456608416` 成功；Chat Worker 改用 `dinecore-staging` Service Binding 驗證平台管理員，避免跨 Worker HTTP 子請求回 404。
- 已以新 `super_admin` 登入並完成聊天室管理 API Smoke：建立房間 HTTP 201、停用房間 HTTP 200；測試房間已停用，不會留在公開房間清單。
- 管理入口：`https://dinecore-staging.takoson68.workers.dev/staff/platform/chat-rooms`。使用 `manager` 登入會回到 manager dashboard，必須改用 `super_admin` 登入。
- `dep_dinecore_v0.1.2` 已發布聊天室管理頁的「進入聊天室」與即時對話框；線上已驗證可展開 `聊天室・public` 並顯示訊息輸入框。
- `dep_dinecore_v0.1.3` 已發布登入頁的兩組測試帳號快速填入：`manager / manager123` 與 `super_admin / superadmin123`。
- `dep_dinecore_v0.1.4` 已發布：點選「進入聊天室」後直接展開訊息對話框，不需再按第二次展開；Workflow `40461158823` 成功。

## 2026-10-27｜聊天室新訊息自動捲到底部

- `ChatPanel` 的訊息區現在會在新訊息加入及展開對話框時自動捲到最底，避免新訊息被留在捲軸下方看不到。
- `npm run test:chat` 5/5、dineCore build 通過。
- 已發布 `dep_magic-siege_v0.1.51`、`dep_game-demo_v0.1.10`、`dep_dinecore_v0.1.5`；magic-siege Workflow `40461769564`、game-demo Workflow `40461770035` 已成功。

## 2026-10-27｜聊天室收合未讀提示

- `ChatPanel` 收合時收到新訊息會顯示未讀數，展開後清除並捲到最新訊息。
- 已發布 `dep_magic-siege_v0.1.52`、`dep_game-demo_v0.1.11`、`dep_dinecore_v0.1.6`，三個 Workflow 均成功。

## 2026-10-27｜訊息時間與聊天室寬度調整

- 每則訊息右側顯示半透明、較小兩級的 `HH:MM` 時間。
- 聊天視窗展開後右側新增可拖曳寬度把手，寬度限制 240～520px。
- `npm run test:chat` 8/8、dineCore build 通過；已發布 `dep_magic-siege_v0.1.54`、`dep_game-demo_v0.1.13`、`dep_dinecore_v0.1.8`，三個 Workflow 均成功。

## 2026-10-27｜聊天室面板結構與時間欄位修正

- 修正 `ChatPanel.vue` Pug 縮排，讓標題、訊息與輸入框正確留在聊天面板內；右側拖曳寬度把手仍保留。
- 修正訊息時間欄位對應：Worker 廣播使用 `serverTime`，前端現在以 `serverTime`（並相容 `timestamp`）顯示右側半透明小字 `HH:MM`。
- 驗證：`npm run test:chat` 8/8、`VITE_PROJECT=magic-siege npm run build:cloudflare` 通過。
- 已發布 `dep_magic-siege_v0.1.55`、`dep_game-demo_v0.1.14`、`dep_dinecore_v0.1.9`（面板結構修正），以及 `dep_magic-siege_v0.1.56`、`dep_game-demo_v0.1.15`、`dep_dinecore_v0.1.10`（時間欄位修正）；六個 Workflow 均成功。

## 2026-10-27｜聊天室連線狀態燈

- 聊天室標題前新增狀態燈：綠色代表線上、黃色代表連線中／重試中、灰色代表離線或尚未連線；同時提供狀態的無障礙標籤。
- 驗證：`npm run test:chat` 8/8、`VITE_PROJECT=magic-siege npm run build:cloudflare` 通過；線上 `v0.1.57` 已確認連線中黃色、連線後綠色。
- 已發布 `dep_magic-siege_v0.1.57`、`dep_game-demo_v0.1.16`、`dep_dinecore_v0.1.11`，三個 Workflow 均成功。

## 2026-10-27｜切換聊天室後歷史訊息未載入修正

- 原因：管理端切換聊天室時會建立新的 `Chat`，但 Vue 重用已展開的 `ChatPanel`，沒有重新呼叫新聊天室的 `start()`；因此畫面顯示空白，但伺服器訊息沒有被刪除。
- 修正：監聽 `props.chat` 變更，面板已展開時自動啟動新連線並載入該聊天室歷史訊息。
- 驗證：`npm run test:chat` 8/8、`VITE_PROJECT=dineCore npm run build:cloudflare` 通過。
- 已發布 `dep_magic-siege_v0.1.58`、`dep_game-demo_v0.1.17`、`dep_dinecore_v0.1.12`，三個 Workflow 均成功。
