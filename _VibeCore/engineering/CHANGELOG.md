## 2026-10-22

- 新增 chatCore Staging 發布目標，使用獨立 Static Assets Worker 與 Private Chat Lab Signaling Durable Object；不綁定 D1，並維持與既有公開聊天室路由／Durable Object 隔離。

- 整合 Repository AI 導讀：根 `AGENTS.md` 增加任務路由，`platform/` 子系統與 Workspace 主題資料補上索引；縮減 AI 初始化必讀為最小集合，並校正既有 Project 文件例外及 Worker 移植現況描述。
- 將 `GEMINI.md` 收斂為通用入口轉址，並使 `STARTUP_DECLARATION.md` 的啟動確認成為內部 Gate，消除與 `AGENTS.md` 直接執行規則的衝突。
- 將 `dinecore-*` Skills 標示為歷史 PHP/MySQL 範例並補上 Worker/D1 防誤用邊界；各 Skill 與 Workspace 研究／草稿資料夾增設局部索引，根層架構報告移入 `_workspace/_reports/`。
- 將 `_ai-context/_index.md` 與 `_workspace/_index.md` 正名為各自目錄的 `index.md`，並更新入口引用以符合 Index-based Reading Protocol。
- 新增部署請求關鍵字路由：明確區分 Staging 新版本 Tag 發布、既有版本控制台切換與一般 Git 推送；將「我要部署」的必要 Commit／Push／新 Tag 授權範圍及安全停止條件同步到 AI 導引、工程工作流程與 Git 規則。
- 版本控制台預設模式接上受控 GitHub Staging Workflow Dispatch；可從已驗證 Release 部署指定版本或回退 previous，輪詢執行狀態並刷新 current／previous。操作保留 loopback、same-origin、GitHub 身分／角色、完整確認字串與 Audit Gate；瀏覽器不接觸寫入憑證，Production 與 Release 刪除不在本次啟用範圍。
- 更新 Tag／Release 控制台執行里程碑與操作手冊，明確區分本機程式驗證和遠端 Staging 驗收；未 Push／Dispatch 的項目仍列為未完成。

## 2026-10-21

- Staging 發布改為 `dep_<project>_v<version>` Tag 明確觸發；一般 Branch Push 不再部署。Workflow 一次只接受 game-demo、dineCore 或 project-b 單一目標，另保留白名單式手動救援入口。
- 發布流程新增不可變 ZIP、逐檔 manifest、完整 ZIP SHA-256、七天診斷 Artifact 與 GitHub Release 長期保存；同名 Release 已有資產時拒絕覆寫。
- 新增 Tag 解析回歸測試與 `TAG_DEPLOYMENT_MANUAL.md`，記錄非 AI 操作、Project 差異、安全回退及未來版本控制台銜接方式。
- 新增獨立 `game-demo-staging` Static Assets Worker 設定；遊戲專案不綁 D1、不覆蓋既有 dineCore／project-b Staging。Cloudflare 公開部署、首頁、SPA fallback 與入口資產 Smoke Test 通過。
- 將 `moduCore_Game` 的可選遊戲能力整合回主平台：新增 `Game` 類別、遊戲私有 Container、生命週期、p5／FPS 適配器、`game-demo` Project 與遊戲回歸測試。
- `Container` 類別改為可匯出並允許注入 services；既有平台單例仍使用原本 services，未更動預設 Project、既有 Projects 或部署流程。

## 2026-10-15

- 參考 `h5-basic-style` 的 AI 導讀與工作恢復方式，新增根目錄 `AGENTS.md` 作為跨 AI 工具入口
- 建立 `_ai-context/` 操作層，包含 AI 實作引導、架構摘要、工程摘要、導讀、紀錄、Git 與語言規則
- `_ai-context/` 僅負責導讀與工作方式，正式裁決仍由 `_VibeCore/` 負責，避免複製規則後形成雙重真相
- 新增 `AI_WORKFLOW.md`，定義任務開始、證據分類、驗證矩陣、完成條件及資料分流
- 新增 `_workspace/CURRENT_WORK.md` 與 `_workspace/_index.md`，建立最小可恢復的工作狀態
- 更新 `AI_PROJECT_ENTRY.md` 的現況專案清單、最小導讀與 Cloudflare Workers + D1 後端方向
- 未修改 `_VibeCore/world/`，既有 World 裁決層級維持不變

## 2026-03-10

- 將「每完成一個 Phase 或一組 Task，必須執行一次設計哲學偏離檢查」正式納入 `engineering/index.md`
- 偏離檢查明確要求覆蓋：世界邊界、模組責任、命名規則、資料流方向、架構原則
- 若發現偏離，必須先修正偏離，再進入下一階段
- 新增正式規則：`new_engineering/` 中已成熟且常用的工程規範，必須倒入 `engineering/`
- 將下列成熟 convention 倒入 `engineering/CONVENTIONS.md`：Project API Boundary Non-Pollution、Module Data Ownership、Module Registry Boot Pipeline、Layout And Route Resilience、Project Services Hard Boundary、Store And API Boundary
