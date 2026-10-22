## 2026-10-22

- 版本控制台預設模式接上受控 GitHub Staging Workflow Dispatch；可從已驗證 Release 部署指定版本或回退 previous，輪詢執行狀態並刷新 current／previous。操作保留 loopback、same-origin、GitHub 身分／角色、完整確認字串與 Audit Gate；瀏覽器不接觸寫入憑證，Production 與 Release 刪除不在本次啟用範圍。
- 更新 Tag／Release 控制台執行里程碑與操作手冊，明確區分本機程式驗證和遠端 Staging 驗收；未 Push／Dispatch 的項目仍列為未完成。

## 2026-10-21

- Staging 發布改為 `dep_<project>_v<version>` Tag 明確觸發；一般 Branch Push 不再部署。Workflow 一次只接受 game-demo、dineCore 或 project-b 單一目標，另保留白名單式手動救援入口。
- 發布流程新增不可變 ZIP、逐檔 manifest、完整 ZIP SHA-256、七天診斷 Artifact 與 GitHub Release 長期保存；同名 Release 已有資產時拒絕覆寫。
- 新增 Tag 解析回歸測試與 `TAG_DEPLOYMENT_MANUAL.md`，記錄非 AI 操作、Project 差異、安全回退及未來版本控制台銜接方式。
- 新增獨立 `game-demo-staging` Static Assets Worker 設定；遊戲專案不綁 D1、不覆蓋既有 dineCore／project-b Staging。Cloudflare 公開部署、首頁、SPA fallback 與入口資產 Smoke Test 通過。
- 將 `moduCore_Game` 的可選遊戲能力整合回主平台：新增 `Game` 類別、遊戲私有 Container、生命週期、p5／FPS 適配器、`game-demo` Project 與遊戲回歸測試。
- `Container` 類別改為可匯出並允許注入 services；既有平台單例仍使用原本 services，未更動預設 Project、既有 Projects 或部署流程。

## 2026-03-10

- 將「每完成一個 Phase 或一組 Task，必須執行一次設計哲學偏離檢查」正式納入 `engineering/index.md`
- 偏離檢查明確要求覆蓋：世界邊界、模組責任、命名規則、資料流方向、架構原則
- 若發現偏離，必須先修正偏離，再進入下一階段
- 新增正式規則：`new_engineering/` 中已成熟且常用的工程規範，必須倒入 `engineering/`
- 將下列成熟 convention 倒入 `engineering/CONVENTIONS.md`：Project API Boundary Non-Pollution、Module Data Ownership、Module Registry Boot Pipeline、Layout And Route Resilience、Project Services Hard Boundary、Store And API Boundary
