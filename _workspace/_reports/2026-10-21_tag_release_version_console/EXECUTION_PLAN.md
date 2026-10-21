---
status: active
updated: 2026-10-21
authority: execution-plan
scope: tag-release-version-console
---

# ModuCore Tag 發布與版本控制台執行里程碑

## 0. 文件用途

本文件是 Tag 發布、版本封存、回退與版本控制台的可恢復執行清單。新對話或上下文重置後，完成既有 VibeCore 導引，再由本文件的「目前停止點」及第一個未完成項目繼續。

本文件不新增 World 或 Engineering 規則。正式部署操作以 `_VibeCore/engineering/TAG_DEPLOYMENT_MANUAL.md` 為準；本文件負責記錄尚未完成的工程里程碑、Gate 與證據。

## 1. 已確認目標

- 一般 Commit／Push 只保存進度，不部署。
- Staging 只由 `dep_<project>_v<version>` Tag 或受控手動救援觸發。
- 每個 Tag 只部署一個 Project。
- 部署前先建立 ZIP、manifest 與 SHA-256，部署成功後保存於 GitHub Release。
- game-demo 不建立 D1；dineCore 與 project-b 保留各自 Migration 與業務 Smoke。
- 未來控制台可查看 current／previous、下載成品、部署指定版本及回退，但瀏覽器不得持有 GitHub 或 Cloudflare 寫入憑證。
- 前端版本回退不得自動倒退 D1 Schema。

## 2. 當前已完成基線

- [x] 新增 `game-demo`、Game 私有 Container、生命週期、p5 適配與遊戲測試。
- [x] 建立獨立 `game-demo-staging` Static Assets Worker，未綁 D1。
- [x] 手動部署 game-demo-staging，首頁、SPA fallback 與入口資產回傳 200。
- [x] 本機 Workflow 改為 `dep_*_v*` Tag 觸發，普通 Branch Push 不再列為觸發條件。
- [x] 建立 Tag 白名單與 SemVer 解析測試。
- [x] 建立 ZIP、manifest、逐檔 SHA-256 與完整 ZIP checksum 產生器。
- [x] 建立七天 Actions Artifact 與 GitHub Release 上傳流程。
- [x] 建立單 Project 手動救援輸入。
- [x] 建立 `_VibeCore/engineering/TAG_DEPLOYMENT_MANUAL.md`。
- [x] 本機驗證：Worker 45 項、Game 5 項、API 3 項通過；ZIP、checksum、unzip、50 檔 manifest 與 Workflow YAML 通過。

尚未成立的事實：上述變更未 Commit／Push，遠端仍是 `world-oop` Push 自動部署的舊 Workflow；沒有 `dep_*` Tag，也沒有由新流程產生的 GitHub Release。

## 3. 共通完成規則

每個項目完成時，必須在該項目下補上：

- `完成日期`
- `Commit／Tag／Workflow Run`
- `驗證命令或畫面證據`
- `結果`
- `剩餘風險`

不得只勾選而沒有證據。若項目暫不修正，須依 Engineering 規則記錄至 Known Issues；需要人類選擇的方向記錄至 Discussions。

## M0：變更隔離與可提交狀態

目標：從髒工作樹中精確分離本次工程，不帶入 `.env`、憑證、歷史報告或來源不明修改。

### M0-1 工作樹所有權盤點

- [x] 重新執行 `git status --short --branch`。
- [x] 將檔案分為「遊戲整合」、「Tag 發布」、「正式文件」、「使用者既有修改」、「未知來源」。
- [x] 確認 `platform/frontend/.env` 永不納入提交。
- [x] 確認所有 Secret、Token、Cookie、帳密均未出現在 Diff。

完成日期：2026-10-21。證據：以精確路徑加入 Index；`.env`、既有 AI 工作流與歷史報告均留在 Unstaged／Untracked，未進入本次提交。

Gate：每個待提交檔案都有明確責任；未知來源檔案數為零或被排除。

### M0-2 Commit 白名單

- [x] 建立並人工核對精確白名單。
- [x] 白名單至少涵蓋 game-demo、Game 能力、Container 相容修改、p5 lockfile、Tag Workflow、封裝腳本、部署目標、測試、手冊、Changelog。
- [x] 不使用 `git add .` 或全目錄加入。
- [x] 檢查 staged diff 與 `git diff --cached --check`。

完成日期：2026-10-21。證據：正式文件的混合修改採 Index-only 精準 Blob，Staged Diff check 通過。

Gate：Staged Diff 只含本次可說明內容。

### M0-3 最終本機 Gate

- [x] `npm run test:game`。
- [x] `npm run test:api`。
- [x] Worker `npm test`。
- [x] game-demo、project-a、project-b 代表性 Build。
- [x] game-demo Wrangler dry-run。
- [x] Workflow YAML／Tag parser／ZIP 完整性驗證。

完成日期：2026-10-21。證據：Game 5/5、API 3/3、Worker 45/45；三個 Project Build、Wrangler dry-run、YAML、Tag parser、ZIP manifest／checksum 均通過。遊戲 Bundle 體積與 npm audit 風險已分別保留警告及 Known Issue。

Gate：全部成功；警告與未修項目有書面紀錄。

## M1：新 Workflow 啟用

目標：安全地讓遠端從「Push 自動部署」切換為「Tag 明確部署」。

### M1-1 Commit

- [x] 建立單一聚焦 Commit。
- [x] Commit 訊息使用繁體中文並描述 Tag 發布與 game-demo 整合。
- [x] 記錄 Commit SHA。

完成日期：2026-10-21。證據：Commit `1a069112fbdf7b601016a368ceeff7deac7e4eb9`，訊息 `feat - 整合遊戲專案與 Tag 版本發布`。

### M1-2 Push world-oop

- [x] Push 前再次確認遠端 HEAD 未被他人推進；若已推進，先重新核對。
- [x] Push `world-oop`。
- [x] 確認此次普通 Branch Push沒有啟動 Staging Deployment。
- [x] 確認遠端 Workflow 顯示 `dep_*_v*` 與手動單 Project 選單。

完成日期：2026-10-21。證據：Push 前本機與 `origin/world-oop` 均為 `86810ff`；Push `1a06911` 後無 Branch Push Run，遠端 Workflow 僅監聽 `dep_*_v*`。

Gate：遠端 Branch 已有新 Workflow，且普通 Push 不部署任何站。

### M1-3 GitHub 權限檢查

- [x] 確認 Actions 可讀 Repository。
- [x] 確認 `contents: write` 可建立／編輯 GitHub Release。
- [x] 確認 staging Environment 的 Cloudflare Secrets 可供 Tag Workflow 使用。
- [x] 確認 Fork／非受信任來源不能取得部署 Secrets。

完成日期：2026-10-21。證據：正式 Tag Run 可 Checkout、部署並建立 Release；Secrets 綁定 staging Environment，且 Workflow 僅接受 Repository Tag Push 或具 Actions 權限者手動觸發。

Gate：權限最小化且能完成正式 Release 寫入。

## M2：game-demo 第一版 Tag 全鏈驗收

目標：用 `dep_game-demo_v0.1.0` 證明完整流程，而不是只驗證局部腳本。

### M2-1 建立不可變 Tag

- [x] 確認 Tag 指向 M1 已 Push 的 Commit。
- [x] 建立 `dep_game-demo_v0.1.0`。
- [x] Push 單一 Tag。
- [x] 禁止刪除、移動或重用該 Tag。

### M2-2 Workflow 目標隔離

- [x] 確認 Matrix 只有 `game-demo-staging`。
- [x] 確認未執行 D1 Migration、Auth Smoke、Employee Smoke。
- [x] 確認 dineCore／project-b Workflow 與 Cloudflare Version 均未變動。

### M2-3 成品 Gate

- [x] 確認 ZIP 檔名包含 Project、版本及短 Commit SHA。
- [x] 確認 manifest 的 Tag、Commit、Project、Target 正確。
- [x] 對 ZIP 執行 SHA-256 驗證。
- [x] 抽查 manifest 至少三個檔案的逐檔 SHA-256。
- [x] 解壓 ZIP，確認 `site/index.html` 與入口資產存在。

### M2-4 部署與 Release Gate

- [x] Wrangler dry-run 成功。
- [x] Cloudflare 部署成功並取得 Version ID。
- [x] 首頁、深層路徑及入口資產回傳 200。
- [x] GitHub Release 標題、說明及三個資產存在。
- [x] Release 記錄 Commit 與 Cloudflare Version ID。
- [x] 將 Run URL、Release URL、Version ID 寫入本文件。

完成日期：2026-10-21。證據：Run `https://github.com/takoson68/moducore_platform/actions/runs/39534746365`；Release `https://github.com/takoson68/moducore_platform/releases/tag/dep_game-demo_v0.1.0`；Cloudflare Version `10316969-bffb-44e9-815a-666c1d70ddb2`；公開首頁與 SPA 深層路徑皆為 HTTP 200。dineCore 保持 `9a96bfb2-0e03-401a-a684-a0c100ebe98b`，project-b 保持 `0b6beffd-546e-40ad-b5e5-c5eb1a2fcd51`。

Gate：M2 全部成立後，Tag 部署才可宣告正式可用。

## M3：第二版與回退驗收

目標：證明版本歷史與回退可用，並驗證 Project 隔離。

### M3-1 建立可辨識第二版

- [ ] 做一個可人工辨識、低風險的 game-demo 變更。
- [ ] 完成測試並 Commit／Push。
- [ ] 建立 `dep_game-demo_v0.1.1`。
- [ ] 確認第二版部署與 Release 成功。

### M3-2 來源 Commit 回退

- [ ] 從 GitHub Actions 手動救援選擇 game-demo。
- [ ] `ref` 指向 `dep_game-demo_v0.1.0`。
- [ ] 確認重新建置、測試、部署成功。
- [ ] 人工確認畫面回到第一版。
- [ ] 確認 dineCore／project-b 未改變。

Gate：目前「由舊 Tag Commit 重建」回退路徑可用。

### M3-3 current／previous 證據模型

- [ ] 決定 current／previous 的正式真相來源：Cloudflare Deployment、Repository version catalog，或受控後端資料。
- [ ] 禁止僅以瀏覽器 localStorage 作為正式狀態。
- [ ] 設計部署成功後才更新 current、原 current 才成為 previous 的原子順序。
- [ ] 部署失敗時不得移動 current／previous。

Gate：控制台可以從權威來源讀出一致狀態。

## M4：歷史 ZIP 原件回退

目標：不重新建置，直接部署 Release 中已驗證的相同成品。

### M4-1 Release 下載器

- [ ] 只接受 Project 白名單與合法 Tag。
- [ ] 從 GitHub Release 下載 ZIP、manifest、checksum。
- [ ] 驗證 Release Tag 與 manifest Tag 一致。
- [ ] 驗證 ZIP SHA-256。
- [ ] 驗證 manifest 逐檔 SHA-256。
- [ ] 使用安全解壓，拒絕絕對路徑、`..`、符號連結逃逸與異常大小。

### M4-2 重部署 Gate

- [ ] 驗證 manifest Project 與部署 Target 一致。
- [ ] 將 `site/` 放入正確 Static Assets 目錄。
- [ ] 執行 Wrangler dry-run。
- [ ] 部署及 Smoke Test 成功後才更新 current／previous。
- [ ] 保留舊 Cloudflare Version ID 與新重部署 Version ID 的關聯。

Gate：同一歷史 ZIP 可重部署，Hash 與初次發布完全一致。

## M5：D1 Project 相容與多專案 Tag 驗收

目標：讓 dineCore／project-b 使用相同發布骨架，但不把前端回退誤當資料庫回退。

### M5-1 Schema 相容資訊

- [ ] manifest 新增 `minimumSchemaVersion` 或等價欄位。
- [ ] 建置時從正式 Migration 狀態推導，不接受人工任意值。
- [ ] 部署／回退前讀取遠端已套用 Migration。
- [ ] 遠端 Schema 低於最低需求時先 Migration；不相容時拒絕部署。
- [ ] 明文規定不自動倒退 D1 Migration。

### M5-2 dineCore Tag

- [ ] 建立一個經授權的 dineCore Staging Tag。
- [ ] 驗證只執行 dineCore。
- [ ] 驗證 Migration、Health、Auth 與隔離 Smoke。
- [ ] 確認 project-b、game-demo、舊站未變。

### M5-3 project-b Tag

- [ ] 建立一個經授權的 project-b Staging Tag。
- [ ] 驗證只執行 project-b。
- [ ] 驗證 Migration、Health、Auth、Employee 與隔離 Smoke。
- [ ] 確認 dineCore、game-demo、舊站未變。

Gate：三個 Project 均有真實 Tag 成功證據。

## M6：唯讀版本控制台

目標：先建立不具寫入風險的版本視圖。

### M6-1 控制台資料契約

- [ ] 定義 Project、Release、Deployment、Artifact、current、previous 與 Smoke 狀態欄位。
- [ ] 明確區分 Git Tag、GitHub Release、Cloudflare Version 與部署時間。
- [ ] 定義資料缺失、Release 不完整、Hash 失敗與遠端無法查詢的顯示方式。

### M6-2 唯讀畫面

- [ ] Project 列表及固定 Staging 網址。
- [ ] current／previous。
- [ ] Tag、版本、Commit、建置及部署時間。
- [ ] Cloudflare Version ID。
- [ ] ZIP／manifest／checksum 狀態。
- [ ] Smoke 結果與最近失敗原因。
- [ ] ZIP 下載入口。

### M6-3 安全邊界

- [ ] 瀏覽器不保存 GitHub Token、Cloudflare Token 或 Actions Secret。
- [ ] 未登入或無權限使用者只能讀取允許公開的資料。
- [ ] 私有 Repository 資料只能由受控後端代理。

Gate：控制台可準確顯示版本，但沒有部署、刪除或回退按鈕。

## M7：受控版本切換控制台

目標：在具備權限與稽核後加入寫入操作。

### M7-1 身份與授權

- [ ] 決定操作員身份來源。
- [ ] 定義 Viewer、Deployer、Admin 權限。
- [ ] 對部署、回退、刪除要求重新驗證或二次確認。
- [ ] 所有動作記錄操作者、時間、來源版本、目標版本與結果。

### M7-2 Workflow Dispatch 橋接

- [ ] 控制台只能要求受控後端觸發 GitHub Workflow。
- [ ] 後端只接受白名單 Project、Tag 與動作。
- [ ] 寫入憑證保存在 Server Secret，不回傳瀏覽器。
- [ ] 顯示 queued／running／success／failed 狀態。
- [ ] 防止同 Project 併發部署；不同 Project 可獨立排程。

### M7-3 操作功能

- [ ] 部署指定版本。
- [ ] 一鍵回退 previous。
- [ ] 取消尚未開始的操作。
- [ ] current 不可刪除。
- [ ] previous 預設不可刪除，除非先建立新的安全回退點。
- [ ] 每 Project 至少保留一個已驗證版本。
- [ ] 批次刪除需二次確認並列出不可恢復影響。

Gate：控制台寫入操作均走同一套 Workflow Gate，不存在旁路部署。

## M8：成品、相依與保存最佳化

### M8-1 game-demo 成品瘦身

- [ ] 盤點目前約 50 個 ZIP 檔案。
- [ ] 移除 game-demo 不需要的 project-b／mtk2mad／共用舊資產。
- [ ] 確認 favicon、字型及必要圖示沒有誤刪。
- [ ] 瘦身後重新 Build、ZIP、瀏覽器與 Smoke 驗證。

### M8-2 Bundle 與相依

- [ ] 評估 p5 約 1.28 MB 入口 Bundle。
- [ ] 評估真正的 chunk／延遲載入策略；不得只調高警告門檻。
- [ ] 處理已記錄的 5 項 high severity npm audit。
- [ ] 升級後執行三 Project Build 與全部相關測試。

### M8-3 保存政策

- [ ] 決定 GitHub Release 是否永久保留。
- [ ] 確認 Actions Artifact 維持七天或調整。
- [ ] 定義 current、previous、最低保留數及刪除冷卻期。
- [ ] 定義儲存量、版本數及成本警戒線。
- [ ] 超過門檻後再評估 R2，不預先導入付費依賴。

Gate：成品大小、漏洞與保存成本有可驗證標準。

## M9：Production 發布

目標：Staging 穩定後才建立正式發布，不共用隱含權限。

- [ ] 定義 `prod_<project>_v<version>` Tag。
- [ ] Production 使用獨立 Workflow 或明確分離 Job。
- [ ] GitHub Production Environment 啟用人工核准。
- [ ] Staging／Production Secrets、Worker、D1 與網址完全分離。
- [ ] Production 首次發布前完成備份／回復與容量檢查。
- [ ] Production 部署後執行只會產生可清理資料的 Smoke。
- [ ] 定義失敗停止、Worker 回復與 D1 不自動倒退程序。

Gate：Production 不可能由 Staging Tag、普通 Push 或控制台未授權操作觸發。

## 4. 遺漏補強清單

以下項目是初版清單容易遺漏、已納入里程碑的部分：

- [ ] Tag 必須指向已包含新 Workflow 的遠端 Commit，否則不會使用新流程。
- [ ] Tag 與 Release 資產不可移動、覆寫或重用。
- [ ] 手動救援必須只允許單 Project，不能用 `all`。
- [ ] 部署用 Commit 必須以 Checkout 後的實際 `git rev-parse HEAD` 記錄。
- [ ] 部署失敗不能建立成功 Release，也不能更新 current／previous。
- [ ] ZIP 解壓需防 Zip Slip、符號連結逃逸與壓縮炸彈。
- [ ] 控制台需要權威狀態來源，不能只依賴 localStorage。
- [ ] 控制台不能把第三方寫入 Token 放到瀏覽器。
- [ ] 同 Project 需部署互斥，避免 current／previous 競態。
- [ ] 前端版本回退與 D1 Schema 回復必須分開。
- [ ] 必須驗證 GitHub Release 寫入權限及 Environment Secret 可用性。
- [ ] 正式 Release 與七天診斷 Artifact 的保存責任不同。
- [ ] 部署紀錄必須同時保存 Tag、Commit、ZIP Hash、Workflow Run、Cloudflare Version ID 與 Smoke 結果。

## 5. 目前停止點

目前停在 M3：M0、M1 與 game-demo 第一版 Tag 全鏈驗收均已完成；Tag 發布已可正式使用。

唯一下一步：依產品優先順序選擇是否執行 dineCore／project-b 首版 Tag 驗收，或直接進入版本控制台的權威資料模型設計。

## 6. 完成紀錄

後續每次工作將結果追加於此，不覆蓋歷史：

| 日期 | 項目 | 結果 | 證據 | 剩餘風險 |
|---|---|---|---|---|
| 2026-10-21 | 基線實作 | 本機完成 | Worker 45、Game 5、API 3；ZIP／manifest／checksum／YAML 通過 | 未 Commit／Push；未做真實 Tag Run |
| 2026-10-21 | M0 變更隔離與本機 Gate | 完成 | 精確白名單；Diff check；Worker 45、Game 5、API 3；三 Project Build；Wrangler dry-run | 尚未 Commit／Push；未做真實 Tag Run |
| 2026-10-21 | M1 新 Workflow 啟用 | 完成 | Commit `1a06911`；普通 Branch Push 無部署；遠端 Tag trigger 生效 | Actions runner 提示 Ubuntu／Node 版本遷移警告 |
| 2026-10-21 | M2 game-demo v0.1.0 | 完成 | Run `39534746365`；Release 三資產；Version `10316969-bffb-44e9-815a-666c1d70ddb2`；HTTP 200 | dineCore／project-b 尚未做新 Tag 首版驗收 |
