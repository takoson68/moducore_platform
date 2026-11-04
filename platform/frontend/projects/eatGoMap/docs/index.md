# eatGoMap 文件索引

本目錄保存 `eatGoMap` 的需求探索、介面草稿、來源資料與後續規格整理；不承載平台共用規則。

## 閱讀順序

1. [`sources/HACKMD_INITIAL_REQUIREMENTS_2026-11-04.md`](./sources/HACKMD_INITIAL_REQUIREMENTS_2026-11-04.md)：2026 年 11 月 4 日擷取的 HackMD Markdown 原文快照。
2. [`PROJECT_BRIEF.md`](./PROJECT_BRIEF.md)：目前已知產品需求、畫面架構、資料概念、API 邊界與開發順序。
3. [`MAP_HOME_PROTOTYPE.md`](./MAP_HOME_PROTOTYPE.md)：目前可瀏覽首頁的完成範圍、未完成功能與驗證結果。
4. [`../modules/index.md`](../modules/index.md)：目前模組入口與 Google Maps 整合範圍。
5. [`SOURCE_REGISTRY.md`](./SOURCE_REGISTRY.md)：外部需求文件、原始草稿圖與本地備份位置。
6. [`assets/大阪食旅共享地圖與日誌.png`](./assets/大阪食旅共享地圖與日誌.png)：手機介面草稿原圖備份。

## 文件狀態

- 本目錄內容目前屬於需求探索與規劃資料。
- Staging 目標為 `eatgomap-staging`，網址為 `https://eatgomap-staging.takoson68.workers.dev`；只部署前端原型，不含合作方 API、資料庫或正式服務。Google Maps Key 從 GitHub `staging` Environment Secret 注入，最終網域的 API／來源限制待網域確定後設定。
- 未標示為正式 API 契約、資料庫 Schema 或已完成實作者，均不得視為現況證明。
- 專案方向、限制與假設的主文件仍為 [`PROJECT_CONTEXT.md`](../PROJECT_CONTEXT.md)。
