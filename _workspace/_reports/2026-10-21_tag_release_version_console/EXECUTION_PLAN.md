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

- [x] 做一個可人工辨識、低風險的 game-demo 變更。
- [x] 完成測試並 Commit／Push。
- [x] 建立 `dep_game-demo_v0.1.1`。
- [x] 確認第二版部署與 Release 成功。

完成日期：2026-10-21。證據：右上角新增 `v0.1.1` 版本膠囊；Commit `0e36c3777729af510233b30ea704381f52d4d2c2`；Game 5/5、API 3/3 與 game-demo Build 通過；Run `https://github.com/takoson68/moducore_platform/actions/runs/39535059984`；Release `https://github.com/takoson68/moducore_platform/releases/tag/dep_game-demo_v0.1.1`；Cloudflare Version `e0c61fc3-4656-4f42-94e1-1e4f9f97f70e`。

### M3-2 來源 Commit 回退

- [x] 從 GitHub Actions 手動救援選擇 game-demo。
- [x] `ref` 指向 `dep_game-demo_v0.1.0`。
- [x] 確認重新建置、測試、部署成功。
- [x] 人工確認畫面回到第一版。
- [x] 確認 dineCore／project-b 未改變。

完成日期：2026-10-21。證據：救援 Run `https://github.com/takoson68/moducore_platform/actions/runs/39535192834`；部署後入口資產回到第一版 `index-BovrI6cx.js` 且不含 `v0.1.1`；Cloudflare Version `191549fd-de2b-4070-9f0a-e55e24ab6c2c`；首頁與深層路徑 HTTP 200。dineCore 仍為 `9a96bfb2-0e03-401a-a684-a0c100ebe98b`，project-b 仍為 `0b6beffd-546e-40ad-b5e5-c5eb1a2fcd51`。

Gate：目前「由舊 Tag Commit 重建」回退路徑可用。

### M3-3 current／previous 證據模型

- [x] 決定 current／previous 的正式真相來源：Cloudflare Deployment、Repository version catalog，或受控後端資料。
- [x] 禁止僅以瀏覽器 localStorage 作為正式狀態。
- [x] 設計部署成功後才更新 current、原 current 才成為 previous 的原子順序。
- [x] 部署失敗時不得移動 current／previous。

完成日期：2026-10-21。正式真相來源採 GitHub Deployments，GitHub Releases 保存不可變成品，Cloudflare Version ID 作交叉證據。Workflow 只在全部 Gate 成功後建立 `success` Deployment；GitHub 自動把原 current 標成 `inactive`，成為 previous。實測 current Deployment `7216537286` 為 `dep_game-demo_v0.1.0`、Cloudflare Version `feb40e63-6b5f-43ba-a695-c46002e772ab`；previous Deployment `7216523961` 為 `dep_game-demo_v0.1.1`、Cloudflare Version `ff07362e-7b08-455d-9786-af653f641198`。兩筆均保存 Commit、ZIP SHA-256、Smoke 與 Run URL。

Gate：控制台可以從權威來源讀出一致狀態。

## M4：歷史 ZIP 原件回退

目標：不重新建置，直接部署 Release 中已驗證的相同成品。

### M4-1 Release 下載器

- [x] 只接受 Project 白名單與合法 Tag。
- [x] 從 GitHub Release 下載 ZIP、manifest、checksum。
- [x] 驗證 Release Tag 與 manifest Tag 一致。
- [x] 驗證 ZIP SHA-256。
- [x] 驗證 manifest 逐檔 SHA-256。
- [x] 使用安全解壓，拒絕絕對路徑、`..`、符號連結逃逸與異常大小。

完成日期：2026-10-21。證據：新增 `download-release-package.mjs` 與安全驗證單元測試；Worker 52/52 通過。以正式 Release `dep_game-demo_v0.1.0` 實測下載三資產，驗證 ZIP SHA-256 `9b2c947ff6cd8e84cc3fbe9aeb966622ee1f8eab68074c3834887456c0328c69`、48 個 site 檔案、內外 manifest 與逐檔 Hash 後安全解壓成功。

### M4-2 重部署 Gate

- [x] 驗證 manifest Project 與部署 Target 一致。
- [x] 將 `site/` 放入正確 Static Assets 目錄。
- [x] 執行 Wrangler dry-run。
- [x] 部署及 Smoke Test 成功後才更新 current／previous。
- [x] 保留舊 Cloudflare Version ID 與新重部署 Version ID 的關聯。

完成日期：2026-10-21。證據：Workflow Run `https://github.com/takoson68/moducore_platform/actions/runs/39539280301` 以 `artifact_source=release` 重部署 `dep_game-demo_v0.1.1`；前端 install／Build／package 明確跳過，Release 驗證、Wrangler dry-run、Worker 53/53、部署與 SPA Smoke 通過。Release checksum 與 Deployment payload 均為 `996b7516822cd0ef93252c06397db1dfc79b1fc60f0961e3024ff062278ccc33`。新 current Deployment `7216995809`、Cloudflare Version `b2f4aeaa-4164-4937-ba24-9f8b41a3ce87`；previous Deployment `7216537286` 保留 v0.1.0 與 Version `feb40e63-6b5f-43ba-a695-c46002e772ab`。線上 v0.1.1 標記可見，其他 Project Version 未變。

Gate：同一歷史 ZIP 可重部署，Hash 與初次發布完全一致。

## M5：D1 Project 相容與多專案 Tag 驗收

目標：讓 dineCore／project-b 使用相同發布骨架，但不把前端回退誤當資料庫回退。

### M5-1 Schema 相容資訊

- [x] manifest 新增 `minimumSchemaVersion` 或等價欄位。
- [x] 建置時從正式 Migration 狀態推導，不接受人工任意值。
- [x] 部署／回退前讀取遠端已套用 Migration。
- [x] 遠端 Schema 低於最低需求時先 Migration；不相容時拒絕部署。
- [x] 明文規定不自動倒退 D1 Migration。

完成日期：2026-10-21。證據：新增 `schema-compatibility.mjs`，只接受 `0001` 起連續正式 Migration，建置時自動推導 `0004_project_b_employees.sql`；manifest、Release 下載器與 GitHub Deployment payload 均保存最低 Schema。Workflow 在 Migration 前後查詢遠端 `d1_migrations`，未知／跳號即停止，低於需求只向前套用，絕不倒退。Worker 58/58、Workflow YAML、project-b manifest 實際封裝通過；dineCore 與 project-b 遠端只讀查核皆為 `0004` 且相容。

### M5-2 dineCore Tag

- [x] 建立一個經授權的 dineCore Staging Tag。
- [x] 驗證只執行 dineCore。
- [x] 驗證 Migration、Health、Auth 與隔離 Smoke。
- [x] 確認 project-b、game-demo、舊站未變。

完成日期：2026-10-21。證據：`dep_dinecore_v0.1.0` 指向 `8f0025e9b84ab18fd18e35f4a8e597d4cf0fc8bd`；Run `https://github.com/takoson68/moducore_platform/actions/runs/39540688796` 的 Matrix 僅有 dinecore-staging，Schema 前後 Gate、Migration、Health、Auth 隔離 Smoke、Release 與 Deployment 狀態全部成功。Release `https://github.com/takoson68/moducore_platform/releases/tag/dep_dinecore_v0.1.0` 保存三資產，manifest minimum Schema 為 `0004_project_b_employees.sql`，ZIP Hash `994926fde195513752f86eddb22fd13752e2d5513dfe87350fffcdf8a9052eb4`。Deployment `7217206508`、Cloudflare Version `5df3e9a9-dfd4-458e-a4c4-a86bcc7b070c`。game-demo 保持 `b2f4aeaa-4164-4937-ba24-9f8b41a3ce87`、project-b 保持 `0b6beffd-546e-40ad-b5e5-c5eb1a2fcd51`、舊站保持 `2a42b8d1-62ae-4a53-b457-12d0f465c400`。

### M5-3 project-b Tag

- [x] 建立一個經授權的 project-b Staging Tag。
- [x] 驗證只執行 project-b。
- [x] 驗證 Migration、Health、Auth、Employee 與隔離 Smoke。
- [x] 確認 dineCore、game-demo、舊站未變。

完成日期：2026-10-21。證據：`dep_project-b_v0.1.0` 指向 `119e4d79b6d40b26d298889a58da8da402628da2`；Run `https://github.com/takoson68/moducore_platform/actions/runs/39540961036` 的 Matrix 僅有 project-b-staging，Schema 前後 Gate、Migration、Health、Auth 隔離、Employee API Smoke、Release 與 Deployment 狀態全部成功。Release `https://github.com/takoson68/moducore_platform/releases/tag/dep_project-b_v0.1.0` 保存三資產，manifest minimum Schema 為 `0004_project_b_employees.sql`、56 個檔案，ZIP Hash `5629c62a64c5add868d30a5752cedfaa785c5efc82f38da9be032e874b73956b`。Deployment `7217249435`、Cloudflare Version `2fde7541-16c9-4213-b205-ac43b9b776e1`。game-demo 保持 `b2f4aeaa-4164-4937-ba24-9f8b41a3ce87`、dineCore 保持 `5df3e9a9-dfd4-458e-a4c4-a86bcc7b070c`、舊站保持 `2a42b8d1-62ae-4a53-b457-12d0f465c400`。

Gate：三個 Project 均有真實 Tag 成功證據。

## M6：唯讀版本控制台

目標：先建立不具寫入風險的版本視圖。

### M6-1 控制台資料契約

- [x] 定義 Project、Release、Deployment、Artifact、current、previous 與 Smoke 狀態欄位。
- [x] 明確區分 Git Tag、GitHub Release、Cloudflare Version 與部署時間。
- [x] 定義資料缺失、Release 不完整、Hash 失敗與遠端無法查詢的顯示方式。

完成日期：2026-10-21。證據：`_VibeCore/engineering/RELEASE_CONSOLE_CONTRACT.md` 定義權威來源、Snapshot、狀態與安全邊界；`platform/worker/scripts/release-console-contract.mjs` 提供固定白名單、列舉與形狀驗證；Worker 測試 62/62 通過。

### M6-2 唯讀畫面

- [x] Project 列表及固定 Staging 網址。
- [x] current／previous。
- [x] Tag、版本、Commit、建置及部署時間。
- [x] Cloudflare Version ID。
- [x] ZIP／manifest／checksum 狀態。
- [x] Smoke 結果與最近失敗原因。
- [x] ZIP 下載入口。

完成日期：2026-10-21。證據：新增 `platform/release-console` 唯讀本機管理面，以伺服器端 `gh`／Wrangler 即時組合 Snapshot；真實查詢三個 Project 與四個 Release 全部為 `healthy`、`complete + verified`，並由瀏覽器確認 current／previous、固定網址、時間、Cloudflare Version、Smoke 與 ZIP 下載入口。Console 測試 2/2、語法檢查及 Worker 62/62 通過。

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

目前停在 M6-3：唯讀控制台畫面與真實 Snapshot 讀取層已完成，尚需完成公開／私有資料及憑證邊界的正式 Gate。

唯一下一步：完成控制台安全邊界驗收，確認瀏覽器不保存 Token、公開讀取範圍、私有 Repository 代理方式，以及控制台沒有任何寫入端點。

## 6. 完成紀錄

後續每次工作將結果追加於此，不覆蓋歷史：

| 日期 | 項目 | 結果 | 證據 | 剩餘風險 |
|---|---|---|---|---|
| 2026-10-21 | 基線實作 | 本機完成 | Worker 45、Game 5、API 3；ZIP／manifest／checksum／YAML 通過 | 未 Commit／Push；未做真實 Tag Run |
| 2026-10-21 | M0 變更隔離與本機 Gate | 完成 | 精確白名單；Diff check；Worker 45、Game 5、API 3；三 Project Build；Wrangler dry-run | 尚未 Commit／Push；未做真實 Tag Run |
| 2026-10-21 | M1 新 Workflow 啟用 | 完成 | Commit `1a06911`；普通 Branch Push 無部署；遠端 Tag trigger 生效 | Actions runner 提示 Ubuntu／Node 版本遷移警告 |
| 2026-10-21 | M2 game-demo v0.1.0 | 完成 | Run `39534746365`；Release 三資產；Version `10316969-bffb-44e9-815a-666c1d70ddb2`；HTTP 200 | dineCore／project-b 尚未做新 Tag 首版驗收 |
| 2026-10-21 | M3-1 game-demo v0.1.1 | 完成 | Commit `0e36c37`；Run `39535059984`；Version `e0c61fc3-4656-4f42-94e1-1e4f9f97f70e`；Release 三資產 | Bundle 體積警告仍存在 |
| 2026-10-21 | M3-2 舊 Tag Commit 回退 | 完成 | Run `39535192834`；第一版入口資產恢復；Version `191549fd-de2b-4070-9f0a-e55e24ab6c2c`；其他 Project 未變 | 目前仍是重新 Build，不是 M4 歷史 ZIP 原件回退 |
| 2026-10-21 | M3-3 current／previous 證據模型 | 完成 | GitHub Deployments `7216537286`／`7216523961`；版本、Tag、Commit、ZIP Hash、Cloudflare Version、Smoke 與 Run URL 可由 API 讀取 | M4 尚未支援直接部署歷史 ZIP 原件 |
| 2026-10-21 | M4-1 Release 下載器 | 完成 | Worker 52/52；正式 v0.1.0 ZIP Hash `9b2c947f…`；48 檔逐檔驗證與安全解壓 | 尚未接入 M4-2 重部署 Workflow |
| 2026-10-21 | M4-2 歷史 ZIP 原件重部署 | 完成 | Run `39539280301`；Hash `996b7516…`；Deployment `7216995809`；Version `b2f4aeaa-4164-4937-ba24-9f8b41a3ce87` | D1 Project 仍需 M5 Schema 相容 Gate |
| 2026-10-21 | M5-1 D1 Schema 相容 Gate | 完成 | Worker 58/58；minimum `0004_project_b_employees.sql`；兩個遠端 D1 皆相容；Workflow 前後檢查 | dineCore／project-b 新 Tag 尚未實跑 |
| 2026-10-21 | M5-2 dineCore v0.1.0 | 完成 | Run `39540688796`；Deployment `7217206508`；Version `5df3e9a9-dfd4-458e-a4c4-a86bcc7b070c`；Schema／Health／Auth 通過 | project-b Tag 尚未實跑 |
| 2026-10-21 | M5-3 project-b v0.1.0 | 完成 | Run `39540961036`；Deployment `7217249435`；Version `2fde7541-16c9-4213-b205-ac43b9b776e1`；Schema／Health／Auth／Employee 通過 | 下一階段為唯讀版本控制台 |
| 2026-10-21 | M6-1 控制台資料契約 | 完成 | 契約文件；機器白名單與驗證器；Worker 62/62 | 尚未建立 Snapshot 讀取層與唯讀畫面 |
| 2026-10-21 | M6-2 唯讀畫面 | 完成 | `platform/release-console`；真實 Snapshot 三 Project healthy；Console 2/2、Worker 62/62；瀏覽器驗收 | 尚待 M6-3 安全邊界正式 Gate |
